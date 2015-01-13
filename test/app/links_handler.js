export default function(state) {
  return new Promise((resolve, reject) => {
    state.indexTabKey = 4;

    resolve({
      component: 'test/app/index.jsx!',
      title: 'links page'
    });
  });
}
