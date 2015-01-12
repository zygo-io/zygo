export default function(state) {
  return Promise.resolve().then(function() {
    state.indexTabKey = 1;
    state.firstTabContent = "Setting the first tab content.";

    return {
      component: 'test/app/index.jsx!',
      title: 'On the first tab!'
    };
  });
}
