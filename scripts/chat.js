$('.chat-window').hide();

var currentUser;
function handleUserResult(user) {
    currentUser = user;
    $('.user-login').fadeOut(400, function() {
        $('.chat-window').fadeIn(400);
    });
}
$('#start-button').on('click', function(event) {
    var userName = $('#name-input').val();
    ChatApp.createOrUpdateUser(userName, -1, handleUserResult, console.error);
});