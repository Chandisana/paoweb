/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Initializes FriendlyChat.
function FriendlyChat() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.messageList = document.getElementById('messages');
  this.messageForm = document.getElementById('message-form');
  //this.messageInput = document.getElementById('message');
  this.submitButton = document.getElementById('submit');
  //this.submitImageButton = document.getElementById('submitImage');
  this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');

  //pao from form
  this.paotitle =document.getElementById('title');
  this.paobody =document.getElementById('body');
  this.paoimageUrl=document.getElementById('imageUrl');
  this.paooriginalNewsUrl=document.getElementById('originalNewsUrl');


  // Saves message on form submit.
  this.messageForm.addEventListener('submit', this.saveMessage.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  //this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  //this.messageInput.addEventListener('change', buttonTogglingHandler);

  // Events for image upload.
  /*this.submitImageButton.addEventListener('click', function() {
    this.mediaCapture.click();
  }.bind(this));
  this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));
   */
  this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
FriendlyChat.prototype.initFirebase = function() {
  // TODO(DEVELOPER): Initialize Firebase.
   // Shortcuts to Firebase SDK features.
    this.auth = firebase.auth();
    this.database = firebase.database();
    this.storage = firebase.storage();
    // Initiates Firebase auth and listen to auth state changes.
    this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Loads chat messages history and listens for upcoming ones.
FriendlyChat.prototype.loadMessages = function() {
  // TODO(DEVELOPER): Load and listens for new messages.
  // Reference to the /messages/ database path.
    this.messagesRef = this.database.ref('prod/frompao');
    // Make sure we remove all previous listeners.
    this.messagesRef.off();

    // Loads the last 12 messages and listen for new ones.
    var setMessage = function(data) {
      var val = data.val();
      //this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl,val.createdOn);
    }.bind(this);
    this.messagesRef.limitToLast(2).on('child_added', setMessage);
    this.messagesRef.limitToLast(2).on('child_changed', setMessage);
};

// Loads categories in the categories
FriendlyChat.prototype.loadCategories = function() {
  // TODO(DEVELOPER): Load and listens for new messages.
  // console.info('inside setCategories');
  // Reference to the /messages/ database path.
    this.categoriesRef = this.database.ref('prod/categories');
    // Make sure we remove all previous listeners.
    this.categoriesRef.off();

    // Loads the last 12 messages and listen for new ones.
    var setCategories = function(data) {
     // console.info('inside setCategories');
      var cats = data.val();

      //console.info('cats'+cats);
      var splitCats=cats.split(",");
         //console.info('splitCats'+splitCats);
      var options = document.getElementById('categories')
      //console.info('options'+options);
      var i;
      for (i = 0; i < splitCats.length; i++) {
          //console.info('splitCats'+splitCats[i]);

           var opt = document.createElement("option");
                     opt.value= splitCats[i];
                     opt.innerHTML = splitCats[i];; // whatever property it has

                     // then append it to the select element
                     options.appendChild(opt);
      }

      //this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl,val.createdOn);
    }.bind(this);
    this.categoriesRef.limitToLast(2).on('child_added', setCategories);
    this.categoriesRef.limitToLast(2).on('child_changed', setCategories);
};


// Saves a new message on the Firebase DB.
FriendlyChat.prototype.saveMessage = function(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  // Check that the user entered a message and is signed in.
   if (this.checkSignedInWithMessage()) {
     var currentUser = this.auth.currentUser;
     // Add a new message entry to the Firebase Database.
     //console.info('saveMessage');
     var messageCreatedOn= -1 * new Date().getTime();
     var pushRef = this.messagesRef.push({createdBy: currentUser.displayName});
     var e = document.getElementById("categories");
     var valCat = e.options[e.selectedIndex].value;
     //console.info('pushRef' + pushRef)
     var uuidKey= pushRef.key;
        //console.info('uuidKey' + uuidKey)
        //console.info('uuidKey' + this.messagesRef.key)
      pushRef.set({
       createdBy: currentUser.email,
       createdOn: messageCreatedOn,
       title:   this.paotitle.value,
       imageUrl:     this.paoimageUrl.value,
       body:    this.paobody.value,
       originalNewsUrl:   this.paooriginalNewsUrl.value,
       image: null,
       uuid: uuidKey,
       disLikes: 0,
       likes: 0,
       needsApproval: 'false',
       tags: [valCat]
     }).then(function() {
       // Clear message text field and SEND button state.
       //FriendlyChat.resetMaterialTextfield(this.messageInput);
       //this.toggleButton();
       this.messageForm.reset();
     }.bind(this)).catch(function(error) {
       console.error('Error writing new message to Firebase Database', error);
     });
   }
};

// Sets the URL of the given img element with the URL of the image stored in Firebase Storage.
FriendlyChat.prototype.setImageUrl = function(imageUri, imgElement) {
 // If the image is a Firebase Storage URI we fetch the URL.
   if (imageUri.startsWith('gs://')) {
     imgElement.src = FriendlyChat.LOADING_IMAGE_URL; // Display a loading image first.
     this.storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
       imgElement.src = metadata.downloadURLs[0];
     });
   } else {
     imgElement.src = imageUri;
   }

  // TODO(DEVELOPER): If image is on Firebase Storage, fetch image URL and set img element's src.
};

// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
FriendlyChat.prototype.saveImageMessage = function(event) {
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  //this.messageForm.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }
  // Check if the user is signed-in
  if (this.checkSignedInWithMessage()) {

    // TODO(DEVELOPER): Upload image to Firebase storage and add message.
     // We add a message with a loading icon that will get updated with the shared image.
        var message= this.messageInput.value;
        //console.info('message '+message);
        var currentUser = this.auth.currentUser;
        this.messagesRef.push({
          name: currentUser.displayName,
          imageUrl: FriendlyChat.LOADING_IMAGE_URL,
          text: message,
          createdOn: new Date().getTime(),
          photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
        }).then(function(data) {

          // Upload the image to Firebase Storage.
          //console.info('inside reset material');
          this.storage.ref(currentUser.uid + '/' + Date.now() + '/' + file.name)
              .put(file, {contentType: file.type})
              .then(function(snapshot) {
                // Get the file's Storage URI and update the chat message placeholder.
                var filePath = snapshot.metadata.fullPath;
                 //console.info('filePath '+filePath);
                data.update({imageUrl: this.storage.ref(filePath).toString()});
                 // Clear message text field and SEND button state.
                 //console.info('messageInput '+this.messageInput);
                 FriendlyChat.resetMaterialTextfield(this.messageInput);
              }.bind(this)).catch(function(error) {
            console.error('There was an error uploading a file to Firebase Storage:', error);
          });
        }.bind(this));

  }
};

// Signs-in Friendly Chat.
FriendlyChat.prototype.signIn = function() {
  // TODO(DEVELOPER): Sign in Firebase with credential from the Google user.
   // Sign in Firebase using popup auth and Google as the identity provider.
    var provider = new firebase.auth.GoogleAuthProvider();
    this.auth.signInWithPopup(provider);
};

// Signs-out of Friendly Chat.
FriendlyChat.prototype.signOut = function() {
  // TODO(DEVELOPER): Sign out of Firebase.
   this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
FriendlyChat.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;    // TODO(DEVELOPER): Get profile pic.
    var userName = user.displayName;        // TODO(DEVELOPER): Get user's name.

    // Set the user's profile pic and name.
    this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
    this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');

    // We load currently existing chant messages.
    this.loadMessages();

    // Load Categories
    this.loadCategories();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    this.userName.setAttribute('hidden', 'true');
    this.userPic.setAttribute('hidden', 'true');
    this.signOutButton.setAttribute('hidden', 'true');

    // Show sign-in button.
    this.signInButton.removeAttribute('hidden');
  }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
FriendlyChat.prototype.checkSignedInWithMessage = function() {
  /* TODO(DEVELOPER): Check if user is signed-in Firebase. */
 if (this.auth.currentUser) {
    return true;
  }
  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Resets the given MaterialTextField.
FriendlyChat.resetMaterialTextfield = function(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

// Template for messages.
FriendlyChat.MESSAGE_TEMPLATE =
    '<div class="message-container">' +
      '<div class="image"></div>' +
      '<div class="message"></div>' +
      '<div class="name"></div>' +
    '</div>';

// A loading image URL.
FriendlyChat.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Displays a Message in the UI.
FriendlyChat.prototype.displayMessage = function(key, name, text, picUrl, imageUri,createdOn) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = FriendlyChat.MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList.appendChild(div);
  }
  if (picUrl) {
    //div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
  var created = new Date(createdOn);
  div.querySelector('.name').textContent = 'pao by ' +name+ ' '+created.getDate()+'-'+created.getMonth()+1+'-'+created.getFullYear();
  if (imageUri) { // If the message is an image.
          var messageElement = div.querySelector('.image');
          var image = document.createElement('img');
          image.addEventListener('load', function() {
            this.messageList.scrollTop = this.messageList.scrollHeight;
          }.bind(this));
          this.setImageUrl(imageUri, image);
          messageElement.innerHTML = '';
          messageElement.appendChild(image);
   }
  var messageElement = div.querySelector('.message');
  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');

  }
  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.messageList.scrollTop = this.messageList.scrollHeight;
  this.messageInput.focus();
};

// Enables or disables the submit button depending on the values of the input
// fields.
FriendlyChat.prototype.toggleButton = function() {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
FriendlyChat.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions.');
  } else if (config.storageBucket === '') {
    window.alert('Your Firebase Storage bucket has not been enabled. Sorry about that. This is ' +
        'actually a Firebase bug that occurs rarely. ' +
        'Please go and re-generate the Firebase initialisation snippet (step 4 of the codelab) ' +
        'and make sure the storageBucket attribute is not empty. ' +
        'You may also need to visit the Storage tab and paste the name of your bucket which is ' +
        'displayed there.');
  }
};

window.onload = function() {
  window.friendlyChat = new FriendlyChat();
};