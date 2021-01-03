import app from './app.js';

Vue.use(VueKonva);

new Vue({
	render: createElement => createElement(app),
}).$mount('#app');
