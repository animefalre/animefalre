// JavaScript code to hide loading animation with fade-out animation
window.addEventListener('load', function() {
  var loadingOverlay = document.getElementById('loading-overlay');
  loadingOverlay.classList.add('fade-out');
  setTimeout(function() {
      loadingOverlay.style.display = 'block';
  }, 1000); // Duration of fade-out animation (500ms)
});


document.addEventListener("DOMContentLoaded", function() {
    var fadeComplete = function(e) { stage.appendChild(arr[0]); };
    var stage = document.getElementById("slider");
    var arr = stage.getElementsByTagName("a");
    for(var i=0; i < arr.length; i++) {
      arr[i].addEventListener("animationend", fadeComplete, false);
     
    }

  }, false);

var nav = document.getElementById('nav');
var navOpen = document.getElementById('nav-open');
var navClose = document.getElementById('nav-close');

document.getElementById('nav').setAttribute("class", "hidden");
navClose.setAttribute("class", "hidden");

navOpen.addEventListener('click', ()=> {
  nav.setAttribute("class", "visible");
  navOpen.setAttribute("class", "hidden");
  navClose.setAttribute("class", "visible");

  if (!document.getElementById('banner-outerid')){
    if (document.getElementById('season-cover')) {
      document.getElementById('season-cover').style.visibility = 'hidden';
    }
    if (document.getElementById('comment-form')){
      document.getElementById('comment-form').style.visibility = 'hidden';
    }
  } else if (!document.getElementById('search-containerid')) {
    document.getElementById('comment-form').style.visibility = 'hidden';
    document.getElementById('season-cover').style.visibility = 'hidden';

  } else if (!document.getElementById('comment-form')) {
    document.getElementById('banner-outerid').style.visibility = 'hidden';
    document.getElementById('search-containerid').style.visibility = 'hidden';
    document.getElementById('season-cover').style.visibility = 'hidden';

  } else if (!document.getElementById('comment-form')) {
    if (!document.getElementById('banner-outerid')){
      if (!document.getElementById('search-containerid')){
        document.getElementById('season-cover').style.visibility = 'hidden';
      }
    }
  } else {
    ''
  }
});
navClose.addEventListener('click', ()=> {
  nav.setAttribute("class", "hidden");
  navClose.setAttribute("class", "hidden");
  navOpen.setAttribute("class", "visible");

  if (!document.getElementById('banner-outerid')){
    if (document.getElementById('season-cover')) {
      document.getElementById('season-cover').style.visibility = 'visible';
    }
    if (document.getElementById('comment-form')){
      document.getElementById('comment-form').style.visibility = 'visible';
    }
  } else if (!document.getElementById('search-containerid')) {
    document.getElementById('comment-form').style.visibility = 'visible';
    document.getElementById('season-cover').style.visibility = 'visible';
  } else if (!document.getElementById('comment-form')) {
    document.getElementById('banner-outerid').style.visibility = 'visible';
    document.getElementById('search-containerid').style.visibility = 'visible';
    document.getElementById('season-cover').style.visibility = 'visible';

  } else if (!document.getElementById('comment-form')) {
    if (!document.getElementById('banner-outerid')){
      if (!document.getElementById('search-containerid')){
        document.getElementById('season-cover').style.visibility = 'visible';
      }
    }
  } else {
    ''
  }


});

const inputBox = document.getElementById('password');
var passShow = document.getElementById('show');
var passHide = document.getElementById('hide');

passHide.style.display = "none";
function show() {
    inputBox.type = "text";
    passShow.style.display = "none";
    passHide.style.display = "block";
};

function hide() {
    inputBox.type = "password";
    passShow.style.display = "block";
    passHide.style.display = "none";
};

// const registerForm = document.getElementById('register-form');

// function registerSubmit() {
//   const emailValue = document.getElementById('email').value; // Move this line inside the function
//   if(emailValue.length === 0){
//     alert('Please fill the form completely');
//   }
//   else{
//     registerForm.action = '/register';
//     registerForm.submit(); // Submit the form
//   }
// }

var nav = document.getElementById('nav');

const searchButton = document.getElementById('searchButton');

if (nav.className === 'visible') {
  searchButton.style.display === 'none';
} else {
  searchButton.style.display === 'visible';
}
