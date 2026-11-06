
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// Gameplay Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdukavbQkCVFbQhXTXypOORWSxgTtEQAU",
  authDomain: "gameplay-89d5e.firebaseapp.com",
  projectId: "gameplay-89d5e",
  storageBucket: "gameplay-89d5e.firebasestorage.app",
  messagingSenderId: "1045421179913",
  appId: "1:1045421179913:web:f9eda13e7cdf2e3c9f64d8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function showMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
  element.classList.toggle("firebase-message-error", isError);
  element.classList.toggle("firebase-message-success", !isError);
}

function friendlyError(error) {
  const messages = {
    "auth/email-already-in-use": "An account already exists with this email address.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Your password must be at least 6 characters long.",
    "auth/invalid-credential": "The email address or password is incorrect.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts. Please wait a while and try again.",
    "permission-denied": "Firebase denied this action. Please check the published Firestore rules."
  };
  return messages[error.code] || "Something went wrong. Please try again.";
}

// PROFILE: registration, login, logout and current account display.
const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");
const authMessage = document.querySelector("#auth-message");
const profileStatus = document.querySelector("#profile-status");
const profileName = document.querySelector("#profile-name");
const profileIntro = document.querySelector("#profile-intro");
const profileAvatar = document.querySelector("#profile-avatar");
const logoutButton = document.querySelector("#logout-button");

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage(authMessage, "");

    const displayName = signupForm.elements.displayName.value.trim();
    const email = signupForm.elements.email.value.trim();
    const password = signupForm.elements.password.value;

    if (!displayName || displayName.length > 40) {
      showMessage(authMessage, "Your display name must be between 1 and 40 characters.", true);
      return;
    }

    const submitButton = signupForm.querySelector("button[type='submit']");
    submitButton.disabled = true;

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", credential.user.uid), {
        displayName,
        createdAt: serverTimestamp()
      });

      signupForm.reset();
      showMessage(authMessage, "Your Gameplay account has been created.");
    } catch (error) {
  const detail = `Firebase error: ${error.code || "unknown"} — ${error.message || "No message returned."}`;

  showMessage(authMessage, detail, true);

  if (profileStatus) {
    profileStatus.textContent = detail;
  }

  console.error("Gameplay signup error:", error);
} finally {
  submitButton.disabled = false;
}
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage(authMessage, "");

    const email = loginForm.elements.email.value.trim();
    const password = loginForm.elements.password.value;
    const submitButton = loginForm.querySelector("button[type='submit']");
    submitButton.disabled = true;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginForm.reset();
      showMessage(authMessage, "You are now signed in.");
    } catch (error) {
      showMessage(authMessage, friendlyError(error), true);
    } finally {
      submitButton.disabled = false;
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showMessage(authMessage, "You have been signed out.");
    } catch (error) {
      showMessage(authMessage, friendlyError(error), true);
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!profileStatus) return;

  if (!user) {
    profileStatus.textContent = "Not signed in";
    if (profileName) profileName.textContent = "Your profile starts here";
    if (profileIntro) profileIntro.textContent = "Sign in or create an account to access your personal Gameplay activity.";
    if (profileAvatar) profileAvatar.textContent = "?";
    if (logoutButton) logoutButton.hidden = true;
    document.querySelectorAll("[data-auth-forms]").forEach((el) => el.hidden = false);
    return;
  }

  if (logoutButton) logoutButton.hidden = false;
  document.querySelectorAll("[data-auth-forms]").forEach((el) => el.hidden = true);
  profileStatus.textContent = "Signed in";
  profileIntro.textContent = user.email || "You are signed in to Gameplay.";

  try {
    const profileSnapshot = await getDoc(doc(db, "users", user.uid));
    const name = profileSnapshot.exists()
      ? profileSnapshot.data().displayName
      : "Gameplay member";

    profileName.textContent = name;
    profileAvatar.textContent = name.charAt(0).toUpperCase();
  } catch (error) {
    profileName.textContent = "Gameplay member";
    profileAvatar.textContent = "G";
  }
});

// COMMUNITY: public discussion reading, signed-in posting and replies.
const discussionForm = document.querySelector("#discussion-form");
const discussionTitle = document.querySelector("#discussion-title");
const discussionContent = document.querySelector("#discussion-content");
const discussionMessage = document.querySelector("#discussion-message");
const discussionsList = document.querySelector("#discussions-list");
const communitySignInNotice = document.querySelector("#community-signin-notice");
const communityUserStatus = document.querySelector("#community-user-status");
const discussionFormSection = document.querySelector("#discussion-form-section");

let communityUser = null;
let replyUnsubscribers = [];

// Create a new discussion.
if (discussionForm) {
  discussionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
console.count("Discussion form submitted");
console.trace("Discussion submission trace");

    if (!communityUser) {
      showMessage(discussionMessage, "Please sign in to start a discussion.", true);
      return;
    }

    const title = discussionTitle.value.trim();
    const content = discussionContent.value.trim();

    if (!title || !content) {
      showMessage(discussionMessage, "Please complete both fields.", true);
      return;
    }

    const submitButton = discussionForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    showMessage(discussionMessage, "");

    try {
      await addDoc(collection(db, "discussions"), {
        creatorId: communityUser.uid,
        title,
        content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      discussionForm.reset();
      showMessage(discussionMessage, "Your discussion has been posted.");
    } catch (error) {
      showMessage(discussionMessage, friendlyError(error), true);
    } finally {
      submitButton.disabled = false;
    }
  });
}


function clearReplyListeners() {
  replyUnsubscribers.forEach((unsubscribe) => unsubscribe());
  replyUnsubscribers = [];
}

async function getDisplayName(uid) {
  try {
    const snapshot = await getDoc(doc(db, "users", uid));
    return snapshot.exists() ? snapshot.data().displayName : "Gameplay member";
  } catch {
    return "Gameplay member";
  }
}

function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "Just now";
  return timestamp.toDate().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function makeTextElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function renderReplies(discussionId, repliesElement) {
  const repliesQuery = query(
    collection(db, "discussions", discussionId, "replies"),
    orderBy("createdAt", "asc")
  );

  const unsubscribe = onSnapshot(repliesQuery, async (snapshot) => {
    repliesElement.replaceChildren();

    if (snapshot.empty) {
      repliesElement.appendChild(makeTextElement("p", "no-replies", "No replies yet."));
      return;
    }

    for (const replyDocument of snapshot.docs) {
      const reply = replyDocument.data();
      const replyCard = document.createElement("article");
      replyCard.className = "community-reply";

      const author = await getDisplayName(reply.authorId);
      const meta = makeTextElement("p", "discussion-meta", `${author} · ${formatDate(reply.createdAt)}`);
      const content = makeTextElement("p", "reply-content", reply.content);

      replyCard.append(meta, content);
      repliesElement.appendChild(replyCard);
    }
  }, (error) => {
    repliesElement.replaceChildren(
      makeTextElement("p", "firebase-message-error", friendlyError(error))
    );
  });

  replyUnsubscribers.push(unsubscribe);
}

async function buildDiscussionCard(documentSnapshot, renderVersion) {
  const discussion = documentSnapshot.data();
  const discussionId = documentSnapshot.id;
  const card = document.createElement("article");
  card.className = "discussion-card";

  const author = await getDisplayName(discussion.creatorId);

  // Stop outdated rendering processes from adding duplicate cards.
  if (renderVersion !== discussionRenderVersion) return null;

  card.appendChild(makeTextElement("p", "discussion-meta", `${author} · ${formatDate(discussion.createdAt)}`));
  card.appendChild(makeTextElement("h3", "discussion-title", discussion.title));
  card.appendChild(makeTextElement("p", "discussion-content", discussion.content));

  const repliesHeading = makeTextElement("h4", "replies-heading", "Replies");
  const repliesElement = document.createElement("div");
  repliesElement.className = "discussion-replies";

  card.append(repliesHeading, repliesElement);
  renderReplies(discussionId, repliesElement);

  if (communityUser) {
    const replyForm = document.createElement("form");
    replyForm.className = "reply-form";

    const replyInput = document.createElement("textarea");
    replyInput.name = "reply";
    replyInput.rows = 2;
    replyInput.maxLength = 5000;
    replyInput.placeholder = "Write a helpful reply...";
    replyInput.required = true;
    replyInput.setAttribute("aria-label", "Your reply");

    const replyButton = document.createElement("button");
    replyButton.type = "submit";
    replyButton.className = "primary-button";
    replyButton.textContent = "Post reply";

    replyForm.append(replyInput, replyButton);

    replyForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const content = replyInput.value.trim();
      if (!content || !communityUser) return;

      replyButton.disabled = true;

      try {
        await addDoc(collection(db, "discussions", discussionId, "replies"), {
          authorId: communityUser.uid,
          content,
          createdAt: serverTimestamp()
        });

        replyForm.reset();
      } catch (error) {
        showMessage(discussionMessage, friendlyError(error), true);
      } finally {
        replyButton.disabled = false;
      }
    });

    card.appendChild(replyForm);
  } else {
    card.appendChild(
      makeTextElement("p", "reply-signin-note", "Sign in to reply to this discussion.")
    );
  }

  return card;
}
  
// COMMUNITY: one central discussion renderer.
let latestDiscussionDocs = [];
let discussionRenderVersion = 0;

async function renderDiscussionList(documents) {
  if (!discussionsList) return;

  const renderVersion = ++discussionRenderVersion;

  clearReplyListeners();
  discussionsList.replaceChildren();

  const emptyMessage = document.querySelector("#no-discussions");

  if (emptyMessage) {
    emptyMessage.hidden = documents.length !== 0;
  }

  for (const discussionDocument of documents) {
    const card = await buildDiscussionCard(
      discussionDocument,
      renderVersion
    );

    if (renderVersion !== discussionRenderVersion) return;

    if (card) {
      discussionsList.appendChild(card);
    }
  }
}

const discussionsQuery = query(
  collection(db, "discussions"),
  orderBy("createdAt", "desc")
);

// This is the ONLY listener that fetches discussion updates.
if (discussionsList) {
  onSnapshot(discussionsQuery, (snapshot) => {
    latestDiscussionDocs = snapshot.docs;
    renderDiscussionList(latestDiscussionDocs);
  }, (error) => {
    discussionsList.replaceChildren(
      makeTextElement("p", "firebase-message-error", friendlyError(error))
    );
  });
}

// Update access and redraw the existing discussions on login/logout.
// Do not fetch discussions a second time.
onAuthStateChanged(auth, (user) => {
  communityUser = user;

  if (communitySignInNotice) {
    communitySignInNotice.hidden = Boolean(user);
  }

  if (discussionFormSection) {
    discussionFormSection.hidden = !user;
  }

  if (communityUserStatus) {
    communityUserStatus.textContent = user
      ? "Signed in — you can start a discussion and reply."
      : "Browsing as a guest. Sign in to post or reply.";
  }

  if (discussionsList) {
    renderDiscussionList(latestDiscussionDocs);
  }
});
