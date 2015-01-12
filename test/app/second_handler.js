export default function(state) {
  return Promise.resolve().then(function() {
    state.indexTabKey = 2;
    state.secondTabContent = "Second tab content.";

    return {
      component: 'test/app/index.jsx!',
      title: 'On the second tab!'
    };
  });
}
