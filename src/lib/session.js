import { SessionManager } from "./session-manager.js";
import { derived } from 'svelte/store';

/**
 * Class to manage app configuration and authentication session state.
*/
class Session extends SessionManager {

	apiUrl = "";

	/**
	 * Init session with application name and configuration
	 *
	 * @param {string} applicationName
	 * @param {*} params
	 */
	init(applicationName, params) {
		super.init(applicationName, params);
		this.apiUrl = params.apiUrl;
	}
}

/**
 * Singleton object to manage app configuration and authentication session state.
 */
export const session = new Session();

/**
 * Svelte store indicating session status.
 */
export const sessionOk = derived(session.ok, ($ok) => $ok);
