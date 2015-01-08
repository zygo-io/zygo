export default function(state) {
  return Promise.resolve().then(function() {
    return {
      component: 'app/index.jsx!',
      title: 'index'
    };
  });
}
