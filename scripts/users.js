// Storage for remembering all the users' preferred colors.
var userColors = {};
// Remember who the current user is.
var currentUser;

// When user data changes, we should (re)remember their color and update the messages already in the DOM.
function handleUserUpdate(user) {
  userColors[user.name] = user.color;
  $(".message").each(function(index, element) {
    var messageDiv = $(element);
    if (user.name === messageDiv.data("user")) {
      messageDiv.css("color", user.color);
    }
  });
}

// Handle DOM event for login form
function handleLoginFormSubmit(event) {
  // Don't POST to server.
  event.preventDefault();
  var userName = $(".username-input").val();
  var colorIndex = $(".color-picker-select").val();
  // Send user data to API
  ChatApp.createOrUpdateUser(userName, colorIndex, function(user) {
    // Remember current user's favorite color
    handleUserUpdate(user);
    currentUser = user;
    // Make sure current user is seen as active so he/she shows up in active user list.
    tickActivity(userName);
    // Hide sign-up form and show chat screen.
    $(".username-picker").hide();
    $(".chat-window").show();
    // Put focus on message input so user can start typing straight away.
    $(".message-input").focus();
    // Start listening for new messages from API
    ChatApp.addMessageListener(handleMessageFromAPI, console.warn);
  });
}
