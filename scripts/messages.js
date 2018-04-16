// Convert the date used in the messages to something that looks pretty even when undefined.
function formatDate(date) {
  if (date) {
    return date.toLocaleString();
  }
  return "pending...";
}

// Add message to the chat screen.
function appendMessage(id, message) {
  // If user is muted we skip the creation of the message element.
  if (!mutedUserEndTimes[message.userName]) {
    var messageDiv = $("<div class='message'></div>")
      .attr("id", "message-" + id)
      // Remember message ID so we can update it.
      .data("message-id", id)
      // Make user's own messages clickable using a special class
      // This is used to make them editable.
      .addClass(
        currentUser && message.userName === currentUser.name
          ? "my-message"
          : "other-message"
      )
      .append(
        $('<span class="time"></span>').text(formatDate(message.timestamp)),
        $('<span class="user"></span>').text(message.userName),
        $('<span class="text"></span>').text(message.text)
      );
    $(".messages-container").append(messageDiv);
    // Scroll to the latest messages when they are added.
    messageDiv[0].scrollIntoView();
    // Defensive check. The message.userName should always exist, but checking to be sure.
    if (message.userName) {
      // Store user name so we can update the colors when necessary.
      messageDiv.data("user", message.userName);
      // If we've previously fetched the color, then use it.
      if (userColors[message.userName]) {
        messageDiv.css("color", userColors[message.userName]);
      } else {
        // otherwise, set the color (so we don't refetch in the meantime)
        userColors[message.userName] = "black";
        // ... ad fetch user data so we can store the color.
        ChatApp.getUser(message.userName, handleUserUpdate);
      }
    }
  }
  // Activity is recorded after each message is received, even if user is muted.
  tickActivity(message.userName, message.timestamp);
}
// Update the message in DOM by ID with new data.
function updateMessage(id, message) {
  var msgJq = $("#message-" + id);
  msgJq.find(".user").text(message.user);
  msgJq.find(".time").text(formatDate(message.timestamp));
  msgJq.find(".text").text(message.text);
}
// Remove message from DOM by ID.
function removeMessage(id) {
  $("#message-" + id).remove();
}
// Callback to be used in ChatApp.addMessageListener
function handleMessageFromAPI(type, id, message) {
  switch (type) {
    case "added":
      return appendMessage(id, message);
    case "modified":
      return updateMessage(id, message);
    // We're not handling remove ATM, because we want the messages to grow forever.
    // case 'removed':
    //     return removeMessage(id);
    default:
      return;
  }
}

// Handle DOM event when user submits the message form (enters a new message).
// TODO: Fix bug that message input form stays in EDIT mode after updating a message.
function handleMessageInput(event) {
  // Do not POST to server.
  event.preventDefault();
  var messageInputElement = $(this).find(".message-input");
  var messageText = messageInputElement.val();
  // Check if the input is in EDIT mode. See handleEditMessageClick
  var messageId = messageInputElement.data("message-id");
  var isEditing = messageInputElement.hasClass("editing");
  if (isEditing || messageId) {
    ChatApp.updateMessage(messageId, messageText);
  } else {
    ChatApp.newMessage(currentUser.name, messageText);
  }
  // Clear input after create/update
  messageInputElement.val("");
}

// Handle DOM event for user click on one of their own messages.
function handleEditMessageClick(event) {
  $(".message-input")
    // Store message ID as data, so we have it when we send to server.
    .data("message-id", $(this).data("message-id"))
    // Make the input look different while editing, using this class.
    .addClass("editing")
    .val(
      // Get text from DOM.
      // We could have used $.data here as well.
      $(this)
        .find(".text")
        .text()
    );
  $(".message-input").focus();
}
