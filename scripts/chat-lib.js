firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();

var ChatApp = {};

// The number of messages fetched from the backend the first time a message listener is created.
ChatApp.fetchSize = 50;

// Starts listening for new messages from the database.
// Will return the previous 'ChatApp.fetchSize' number of old messages before sending new ones.
// The provided handler will receive the params: changeType, messageId, messageData;
//    - changeType can be 'added', 'modified' or 'removed'.
//    - messageId is the ID you can use to reference this message in ChatApp.updateMessage.
//    - messageData is the contents of the message object, which includes text and user name.
ChatApp.addMessageListener = function(handler, errHandler) {
  db
    .collection("messages")
    .orderBy("timestamp", "desc")
    .limit(ChatApp.fetchSize)
    .onSnapshot(function(snapshot) {
      snapshot.docChanges.reverse().forEach(function(docChange) {
        handler(docChange.type, docChange.doc.id, docChange.doc.data());
      });
    }, errHandler);
};

// Calls the callback function with the requested user data.
// The user is identified by their name.
// Useful for finding out their preferred color *hint hint*.
ChatApp.getUser = function(name, callback) {
  db
    .collection("users")
    .doc(name)
    .get()
    .then(function(docRef) {
      callback(docRef.data());
    });
};

// Creates or update a user in the database with the given userName.
// If the user object doesn't exist it will be created, otherwise it will be updated.
// Parameter colorNum should be an index into the ChatApp.colors array or -1 to pick a random color.
// The callback is invoked with the resulting user data.
// errHandler is optional.
ChatApp.createOrUpdateUser = function(userName, colorNum, callback, errHandler) {
  if (colorNum < 0) {
    colorNum = Math.floor(Math.random() * ChatApp.colors.length);
  }
  var data = { name: userName, color: ChatApp.colors[colorNum] };
  db
    .collection("users")
    .doc(userName + "")
    .set(data)
    .then(function() {
      callback(data);
    })
    .catch(errHandler ? errHandler : function(){});
};

// Creates a new message with given text and user name.
// This function doesn't take a callback, because the new message will be 
// received by anyone listening through ChatApp.addMessageListener.
ChatApp.newMessage = function(userName, text) {
  db.collection("messages").add({
    userName: userName,
    text: text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
};

// Updates the text content of a message with the specified messageId.
ChatApp.updateMessage = function(messageId, text) {
  db
    .collection("messages")
    .doc(messageId)
    .set({ text: text }, { merge: true });
};

// Suggested colors for users to choose from.
// When calling ChatApp.newUser you have to pass a valid index into this array.
ChatApp.colors = [
  "Blue",
  "DarkBlue",
  "DarkCyan",
  "DarkGoldenRod",
  "DeepPink",
  "DodgerBlue",
  "ForestGreen",
  "Indigo",
  "Maroon"
];
