/**
 * Utility to copy text to clipboard with graceful browser fallback
 */
export async function copyToClipboard(text, onSuccessMessage = "Copied to clipboard!") {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    return true;
  } catch (err) {
    console.error("Failed to copy text: ", err);
    return false;
  }
}
