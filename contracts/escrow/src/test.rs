#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env, Symbol, String};

#[test]
fn test_deposit_and_release() {
    let env = Env::default();
    env.mock_all_auths();

    // Register contract
    let contract_id = env.register_contract(None, EduPayEscrow);
    let client = EduPayEscrowClient::new(&env, &contract_id);

    // Generate addresses
    let admin = Address::generate(&env);
    let student = Address::generate(&env);
    let university = Address::generate(&env);

    // Initialize contract
    client.initialize(&admin);

    // Setup Mock Token
    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_address);
    let asset_client = token::StellarAssetClient::new(&env, &token_address);

    // Set token on escrow contract
    client.set_token(&token_address);

    // Create payment
    let payment_id = Symbol::new(&env, "pay_1");
    let amount = 1000_i128;
    let term = String::from_str(&env, "Fall 2026");

    client.create_payment(&payment_id, &student, &university, &amount, &term);

    // Check payment status is Deposited initially
    assert_eq!(client.get_payment_status(&payment_id), PaymentStatus::Deposited);

    // Mint tokens to student
    asset_client.mint(&student, &amount);
    assert_eq!(token_client.balance(&student), amount);

    // Deposit to contract
    client.deposit(&payment_id, &amount);

    // Verify balances and status
    assert_eq!(token_client.balance(&student), 0);
    assert_eq!(token_client.balance(&contract_id), amount);
    assert_eq!(client.get_payment_status(&payment_id), PaymentStatus::Escrowed);

    // University releases payment
    client.release_payment(&payment_id, &university);

    // Verify released balances and status
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&university), amount);
    assert_eq!(client.get_payment_status(&payment_id), PaymentStatus::Released);
}

#[test]
fn test_refund_flow() {
    let env = Env::default();
    env.mock_all_auths();

    // Register contract
    let contract_id = env.register_contract(None, EduPayEscrow);
    let client = EduPayEscrowClient::new(&env, &contract_id);

    // Generate addresses
    let admin = Address::generate(&env);
    let student = Address::generate(&env);
    let university = Address::generate(&env);

    // Initialize contract
    client.initialize(&admin);

    // Setup Mock Token
    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_address);
    let asset_client = token::StellarAssetClient::new(&env, &token_address);

    // Set token
    client.set_token(&token_address);

    // Create payment
    let payment_id = Symbol::new(&env, "pay_2");
    let amount = 500_i128;
    let term = String::from_str(&env, "Spring 2027");

    client.create_payment(&payment_id, &student, &university, &amount, &term);

    // Mint and Deposit
    asset_client.mint(&student, &amount);
    client.deposit(&payment_id, &amount);

    assert_eq!(client.get_payment_status(&payment_id), PaymentStatus::Escrowed);

    // Admin refunds student
    client.refund(&payment_id);

    // Verify balances and status
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&student), amount);
    assert_eq!(client.get_payment_status(&payment_id), PaymentStatus::Refunded);
}

#[test]
#[should_panic(expected = "unauthorized caller")]
fn test_unauthorized_release() {
    let env = Env::default();
    env.mock_all_auths();

    // Register contract
    let contract_id = env.register_contract(None, EduPayEscrow);
    let client = EduPayEscrowClient::new(&env, &contract_id);

    // Generate addresses
    let admin = Address::generate(&env);
    let student = Address::generate(&env);
    let university = Address::generate(&env);
    let random_user = Address::generate(&env);

    // Initialize contract
    client.initialize(&admin);

    // Setup Mock Token
    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract(token_admin);
    let _token_client = token::Client::new(&env, &token_address);
    let asset_client = token::StellarAssetClient::new(&env, &token_address);

    // Set token
    client.set_token(&token_address);

    // Create payment
    let payment_id = Symbol::new(&env, "pay_3");
    let amount = 1500_i128;
    let term = String::from_str(&env, "Summer 2026");

    client.create_payment(&payment_id, &student, &university, &amount, &term);

    // Mint and Deposit
    asset_client.mint(&student, &amount);
    client.deposit(&payment_id, &amount);

    // Attempt to release using random_user (should panic with "unauthorized caller")
    client.release_payment(&payment_id, &random_user);
}
