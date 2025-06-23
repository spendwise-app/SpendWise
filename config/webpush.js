import webpush from 'web-push'

const subscriptions = {}; 

webpush.setVapidDetails(
  'mailto:expense.pilot.app@gmail.com',
  "BOUbdwZthI965v6EUxsB3f6G3GQl3VTSIzNKQx8GTwU4A3-tT4TPR_JENX-8ONECKFOMQF1mHMt5KJegQBrJ-qk",
  "8Aoug5dBHhLJqlVH2ejj4Nm8PTSGNNrSMG6yW5wR-Do"
);


export { webpush, subscriptions}