export default function(state) {
  var promise = new Promise(function(resolve, reject) {
    setInterval(function() {
      state.message = "THE MESSAGE";

      resolve({
        component: 'app/message.jsx!',
        title: 'message'
      });
    }, 1000);
  });

  return promise;
}
