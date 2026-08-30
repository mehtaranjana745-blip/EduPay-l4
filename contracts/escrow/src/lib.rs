#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol, String, Vec};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum PaymentStatus {
    Deposited = 0,
    Escrowed = 1,
    Released = 2,
    Refunded = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentRecord {
    pub student: Address,
    pub university: Address,
    pub amount: i128,
    pub term: String,
    pub status: PaymentStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Token,
    Payment(Symbol),
    UserPayments(Address),
}

#[contract]
pub struct EduPayEscrow;

#[contractimpl]
impl EduPayEscrow {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn set_token(env: Env, token: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("not initialized");
        admin.require_auth();
        env.storage().instance().set(&DataKey::Token, &token);
    }

    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).expect("token not set")
    }

    pub fn create_payment(
        env: Env,
        payment_id: Symbol,
        student: Address,
        university: Address,
        amount: i128,
        term: String,
    ) {
        student.require_auth();

        let payment_key = DataKey::Payment(payment_id.clone());
        if env.storage().persistent().has(&payment_key) {
            panic!("payment already exists");
        }

        let record = PaymentRecord {
            student: student.clone(),
            university: university.clone(),
            amount,
            term,
            status: PaymentStatus::Deposited,
        };

        env.storage().persistent().set(&payment_key, &record);

        // Add payment to student's history
        let student_key = DataKey::UserPayments(student.clone());
        let mut student_payments: Vec<Symbol> = env
            .storage()
            .persistent()
            .get(&student_key)
            .unwrap_or(Vec::new(&env));
        student_payments.push_back(payment_id.clone());
        env.storage().persistent().set(&student_key, &student_payments);

        // Add payment to university's history
        let uni_key = DataKey::UserPayments(university.clone());
        let mut uni_payments: Vec<Symbol> = env
            .storage()
            .persistent()
            .get(&uni_key)
            .unwrap_or(Vec::new(&env));
        uni_payments.push_back(payment_id);
        env.storage().persistent().set(&uni_key, &uni_payments);
    }

    pub fn deposit(env: Env, payment_id: Symbol, amount: i128) {
        let payment_key = DataKey::Payment(payment_id.clone());
        let mut record: PaymentRecord = env
            .storage()
            .persistent()
            .get(&payment_key)
            .expect("payment does not exist");

        if record.status != PaymentStatus::Deposited {
            panic!("payment is not in Deposited state");
        }

        if amount != record.amount {
            panic!("incorrect deposit amount");
        }

        record.student.require_auth();

        // Get the token client
        let token_address = Self::get_token(env.clone());
        let token_client = token::Client::new(&env, &token_address);

        // Transfer funds from student to this contract
        token_client.transfer(&record.student, &env.current_contract_address(), &amount);

        // Update status to Escrowed
        record.status = PaymentStatus::Escrowed;
        env.storage().persistent().set(&payment_key, &record);

        // Emit PaymentEscrowed event
        env.events().publish(
            (Symbol::new(&env, "PaymentEscrowed"), payment_id),
            (record.student.clone(), amount),
        );
    }
}
