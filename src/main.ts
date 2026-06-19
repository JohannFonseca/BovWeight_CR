import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import { IonicVue } from '@ionic/vue';

/* Configuración global de Axios: agrega Authorization: Bearer <token> a las peticiones */
import './services/auth-interceptor';

/* CSS central requerido para que los componentes de Ionic funcionen */
import '@ionic/vue/css/core.css';

/* CSS básico para apps creadas con Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Utilidades CSS opcionales */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Modo Oscuro de Ionic
 * -----------------------------------------------------
 * Para más información, ver:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
/* import '@ionic/vue/css/palettes/dark.system.css'; */

/* Variables del tema */
import './theme/variables.css';
import './theme/custom.css';

// Crea la app principal.
const app = createApp(App)
    .use(IonicVue)
    .use(router);

// Monta la app cuando el router está listo.
router.isReady().then(() => {
    app.mount('#app');
});