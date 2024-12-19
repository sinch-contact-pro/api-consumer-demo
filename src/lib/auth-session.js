const savedProps = ["state", "codeVerifier", "code", "idToken", "accessToken", "refreshToken", "tokenType"];

/** Class to store authentication session into browser's session storage */
export class AuthSession {

	/**
	 * Construct a session object
	 *
	 * @param {string} storageItemKey - key for session state in session storage
	 *
	 * @prop {string} state - state during PKCE
	 * @prop {string} codeVerifier - value of code verifier value during PKCE
	 * @prop {string} code - Value of code during PKCE
	 * @prop {string} idToken - Id token from authorization endpoint
	 * @prop {string} accessToken - Access token from authorization endpoint
	 * @prop {string} refreshToken - Refresh token from authorization endpoint
	 * @prop {string} tokenType - Token type from authorization endpoint
	 * @prop {date} tokenExpiry - When id and access tokens expire
	 */
	constructor(storageItemKey) {
		this.storageItemKey = storageItemKey;
		this.state = null;
		this.codeVerifier = null;
		this.code = null;
		this.idToken = null;
		this.accessToken = null;
		this.refreshToken = null;
		this.tokenType = null;
		this.tokenExpiry = null;
	}

	/** Load session from session storage */
	load() {
		const obj = JSON.parse(sessionStorage.getItem(this.storageItemKey));
		for (const name of savedProps) {
			this[name] = obj ? obj[name] : null;
		}
		this.tokenExpiry = obj && obj.tokenExpiry ? new Date(obj.tokenExpiry) : null;
	}

	/** Save session into session storage */
	save() {
		const obj = {};
		for (const name of savedProps) {
			obj[name] = this[name];
		}
		obj.tokenExpiry = this.tokenExpiry;
		sessionStorage.setItem(this.storageItemKey, JSON.stringify(obj));
	}

	/** Clear session */
	clear() {
		sessionStorage.removeItem(this.storageItemKey);
		for (const name of savedProps) {
			this[name] = null;
		}
		this.tokenExpiry = null;
	}
}
