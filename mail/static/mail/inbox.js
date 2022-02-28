document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_email() {
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });
  //This has been done to render the mail just sent.
  setTimeout(() => load_mailbox('sent'), 10);
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Render the inbox if the mailbox is 'inbox'
  if (mailbox === 'inbox') {
    get_emails();
  }

  if (mailbox === 'sent') {
    get_sent_emails(); 
  }

  if (mailbox === 'archive') {
    get_archived();
  }
}

function get_emails() {
  fetch('/emails/inbox')
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      for ( i = 0; i < emails.length; i++ ) {
        (function() {
          var email = emails[i];
          const element = document.createElement('div');
          element.classList.add('inboxMail', `${email.read ? "read" : "notRead"}`);
          element.innerHTML = `<span class="gotomail ${email.read ? "read" : ""}"><strong>${email.sender}</strong></span>
                               <span class="gotomail ${email.read ? "read" : ""}">${email.subject}</span>
                               <span class="sentDate ${email.read ? "read" : ""}">${email.timestamp}</span>
                               <button class="btn btn-sm btn-outline-primary archive-button" onclick="archive(${email.id}, 'archive')">Archive</button>`
          function myListener(event) {
            var button = element.lastChild;
            if (event.target === button) {
              console.log("Archived button clicked");
              return;
            } else {
              get_email(email.id);
            }
          }
          element.addEventListener('click', myListener);
          document.querySelector('#emails-view').append(element);
        }());
      }
  });
}

function get_email(id) {
  fetch(`emails/${id}`)
    .then(response => response.json())
      .then(responseJSON => {
        console.log(responseJSON);
        const element = document.createElement('div');
        element.innerHTML = `<strong>From: </strong> ${responseJSON.sender} <br>
                             <strong>To: </strong>${responseJSON.recipients} <br>
                             <strong>Subject: </strong>${responseJSON.subject} <br>
                             <strong>Timestamp: </strong>${responseJSON.timestamp} <br>
                             <button onclick="reply('${responseJSON.sender}', '${responseJSON.subject}', ${JSON.stringify(responseJSON.body).replace(/&/, "&amp;").replace(/"/g, "&quot;")}, '${responseJSON.timestamp}')" class="btn btn-sm btn-outline-primary">Reply</button> <hr>
                             ${responseJSON.body}`;
        document.querySelector('#emails-view').innerHTML = element.innerHTML;
        mark_as_read(responseJSON.id);
      });
}

function mark_as_read(id) {
  fetch(`emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });
}

function reply(sender, subject, body, date) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  document.querySelector('#compose-recipients').value = sender;
  if (subject.indexOf('Re:') !== -1) {
    document.querySelector('#compose-subject').value = subject;
  } else {
    document.querySelector('#compose-subject').value = `Re: ${subject}`;
  }
  if (body.indexOf('wrote:') !== -1) {
    document.querySelector('#compose-body').value = `On ${date} ${sender} wrote: \"${body.slice(body.indexOf('"', body.indexOf('"')+1)+2)}\"`;
  } else {
    document.querySelector('#compose-body').value = `On ${date} ${sender} wrote: "${body}"`;
  }
}

function get_sent_emails() {
  fetch('/emails/sent')
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      for ( i = 0; i < emails.length; i++ ) {
        (function() {
          var email = emails[i];
          const element = document.createElement('div');
          element.classList.add('inboxMail');
          element.innerHTML = `<span class="gotomail"><strong>${email.sender}</strong></span>
                               <span class="gotomail">${email.subject}</span>
                               <span class="sentDate">${email.timestamp}</span>`
          element.addEventListener('click', () => get_email(email.id));
          document.querySelector('#emails-view').append(element);
        }());
      }
  });
}

function get_archived() {
  fetch('/emails/archive')
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      for ( i = 0; i < emails.length; i++ ) {
        (function() {
          var email = emails[i];
          if (email.archived === true) {
            const element = document.createElement('div');
            element.classList.add('inboxMail');
            element.innerHTML = `<span class="gotomail"><strong>${email.sender}</strong></span>
                                 <span class="gotomail">${email.subject}</span>
                                 <span class="sentDate">${email.timestamp}</span>
                                 <button class="btn btn-sm btn-outline-primary" onclick="archive(${email.id}, 'unarchive')">Unarchive</button>`
            function myListener(event) {
              var button = element.lastChild;
              if (event.target === button) {
                console.log("Archived button clicked");
                return;
              } else {
                get_email(email.id);
              }
            }
            element.addEventListener('click', myListener);
            document.querySelector('#emails-view').append(element);
          }
        }());
      }
  });
}

function archive(id, action) {
  if (action === "archive") {
    fetch(`emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    });
  } else {
    fetch(`emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    });
  }
  document.location.reload()
}