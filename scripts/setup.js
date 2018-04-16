// When page loads, hide the chat screen and leave the sign-in form.
$(".chat-window").hide();

// Sign-in form submission handling.
$(".username-input-form").on("submit", handleLoginFormSubmit);

// Allow messages to be edited by listening for clicks on .chat-window.
// Events bubble up from .my-message elements.
$(".chat-window").on("click", ".my-message", handleEditMessageClick);

var colorSelect = $(".color-picker-select");
// TODO: Make each color appear as an option in the dropdown
// ...

// Message creation/update handling.
$(".message-input-form").on("submit", handleMessageInput);
