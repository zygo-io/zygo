export default function(state) {
  return new Promise((resolve, reject) => {
    //Simulate a cached request.
    setInterval(function() {
      state.indexTabKey = 3;
      state.messages = ['msg1', 'msg2', 'msg3'];

      resolve({
        component: 'test/app/index.jsx!',
        title: 'On the messages tab!'
      });
    }, 500);
  });
}
