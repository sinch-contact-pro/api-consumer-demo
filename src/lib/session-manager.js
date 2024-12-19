import { AuthSession } from "./auth-session";
import { writable } from 'svelte/store';

/**
 * Class to manage authentication session that is stored in browser's session storage.
*/
export class SessionManager {

	constructor() {
		this.applicationName = "app-name";
		this.authenticationUrl = "";
		this.clientId = "";
		this.session = null;
		this.ok = writable(false);
	}

	/**
	 * Init session with application name and configuration
	 *
	 * @param {string} applicationName
	 * @param {*} params -Object with `authenticationUrl` and `clientId`
	 */
	init(applicationName, params) {
		this.applicationName = applicationName;
		this.session = new AuthSession(this.applicationName + "-session");
		this.session.load();
		this.authenticationUrl = params.authenticationUrl;
		this.clientId = params.clientId;
	}

	/**
	 * Complete login procedure
	 *
	 * - Call this whenever a page reload happens.
	 * - It will act based on state in browser's session storage.
	 * - If session is already ok, page reloads will not happen, and this is essentially a no-op.
	 * - If session is still being constructed, page reloads will happen.
	 */
	async completeLogin() {
		console.log("SessionManager.completeLogin");
		this.session.load();
		const searchParams = new URLSearchParams(document.location.search);
		const state = searchParams.get("state");
		const code = searchParams.get("code");
		if (this.session.refreshToken) {
			console.log("SessionManager.completeLogin: Session ok");
			this.ok.set(true);
			if (state || code) {
				// hide auth params from address bar
				document.location.replace(document.location.origin);
			}
		} else {
			if (
				state !== null &&
				state !== "" &&
				code !== null &&
				code !== ""
			) {
				if (state === this.session.state) {
					this.session.code = code;
					this.session.save();
					console.log("SessionManager.completeLogin: Authentication ok");
					await this.#getTokens();
					this.ok.set(true);
					// hide auth params from address bar
					document.location.replace(document.location.origin);
				} else {
					console.log("SessionManager.completeLogin: Authentication failed - invalid state in URL");
				}
			} else {
				console.log("SessionManager.completeLogin: No session");
			}
		}
	}

	/**
	 * Get access token that can be used e.g. as bearer token in authorization header of an HTTPS request.
	 * - If token has expired, or is about to expire in `timeToExpire` seconds, tries to refresh it using session's refresh token.
	 *
	 * @param {number} timeToExpire - Token will be refreshed, if it will expire within `timeToExpire` seconds
	 */
	async getAccesstoken(timeToExpire) {
		if (!this.session.refreshToken)
			return null;
		if (this.session.tokenExpiry.getTime() - Date.now() < timeToExpire * 1000)
			await this.refreshTokens();
		return this.session.accessToken;
	}

	/**
	 * Get id token that can be used e.g. as bearer token in authorization header of an HTTPS request.
	 * - If token has expired, or is about to expire in `timeToExpire` seconds, tries to refresh it using session's refresh token
	 *
	 * @param {number} timeToExpire - Token will be refreshed, if it will expire within `timeToExpire` seconds
	 */
	async getIdToken(timeToExpire) {
		if (!this.session.refreshToken)
			return null;
		if (this.session.tokenExpiry.getTime() - Date.now() < timeToExpire * 1000)
			await this.refreshTokens();
		return this.session.idToken;
	}

	/**
	 * Clear session and perform logout in authentication service.
	 * - This this will cause page reloads.
	 */
	async logout() {
		console.log("SessionManager.logout");
		if (this.session.refreshToken) {
			this.ok.set(false);
			this.session.clear();
			const params = {
				client_id: this.clientId,
				logout_uri: document.location.origin,
			};
			console.log("SessionManager.logout this:", this);
			console.log("SessionManager.logout navigate:", `${this.authenticationUrl}/logout?${this.#queryString(params)}`);
			document.location = `${this.authenticationUrl}/logout?${this.#queryString(params)}`;
		} else {
			this.session.clear();
			return;
		}
	}

	/**
	 * Get new id and access token using session's refresh token.
	 * - Application should check when tokens are about to expire, and call this ahead of time.
	 * - This will not cause page reloads.
	 */
	async refreshTokens() {
		console.log("SessionManager.refreshTokens");
		if (!this.session.refreshToken) {
			console.log("SessionManager.refreshTokens: Cannot refresh tokens without session");
			return;
		}
		this.idToken = null;
		this.accesstoken = null;
		const res = await fetch(`${this.authenticationUrl}/oauth2/token`, {
			method: "POST",
			headers: new Headers({
				"content-type": "application/x-www-form-urlencoded",
			}),
			body: this.#queryString({
				grant_type: "refresh_token",
				client_id: this.clientId,
				refresh_token: this.session.refreshToken,
			}),
		});
		if (!res.ok) {
			console.log("SessionManager.refreshTokens: Failed to get tokens: " + (await res.json()));
		} else {
			const tokens = await res.json();
			this.session.idToken = tokens.id_token;
			this.session.accessToken = tokens.access_token;
			this.session.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
			this.session.save();
		}
	}

	/**
	 * Check whether session is ok or not.
	 *
	 * @returns {boolean}
	 */
	sessionOk() {
		return this.session.refreshToken !== null
	}

	/**
	 * Start login procedure
	 *
	 * - Call this when you need the access, or id token in your app.
	 * - This will cause page reloads.
	 */
	async startLogin() {
		console.log("SessionManager.startLogin");
		const state = (this.session.state = await this.#generateNonce());
		this.session.codeVerifier = await this.#generateNonce();
		this.session.code = null;
		this.session.save();
		const params = {
			response_type: "code",
			client_id: this.clientId,
			state: state,
			code_challenge_method: "S256",
			code_challenge: this.#base64URLEncode(await this.#sha256(this.session.codeVerifier)),
			redirect_uri: document.location.origin
		};
		document.location = `${this.authenticationUrl}/authorize?${this.#queryString(params)}`;
	}

	/**
	 * Calculate SHA256 digest of a string
	 *
	 * @param {string} str - String to calculate
	 *
	 * @returns {Promise<ArrayBuffer>}
	 */
	async #sha256(str) {
		return crypto.subtle.digest(
			"SHA-256",
			new TextEncoder().encode(str)
		);
	}

	/**
	 * Generate a cryptographically random string
	 *
	 * @returns {Promise<string>}
	 */
	async #generateNonce() {
		const hash = await this.#sha256(
			crypto.getRandomValues(new Uint32Array(4)).toString()
		);
		const hashArray = Array.from(new Uint8Array(hash));
		return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	}

	/**
	 * Encode array buffer to Base64-URL-encoded string, which is suitable for use in URL
	 *
	 * @param {ArrayBuffer} data - Data to encode
	 *
	 * @returns {string}
	 */
	#base64URLEncode(data) {
		return btoa(String.fromCharCode.apply(null, new Uint8Array(data)))
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");
	}

	/**
	 * Serialize properties of object into a query string suitable for use in URL
	 *
	 * @param {object} obj - Object to serialize
	 *
	 * @returns {string}
	 */
	#queryString(obj) {
		return new URLSearchParams(Object.entries(obj)).toString();
	}

	/**
	 * Complete session construction by fetching tokens from authorization services token endpoint
	 */
	async #getTokens() {
		const res = await fetch(`${this.authenticationUrl}/oauth2/token`, {
			method: "POST",
			headers: new Headers({
				"content-type": "application/x-www-form-urlencoded",
			}),
			body: this.#queryString({
				grant_type: "authorization_code",
				client_id: this.clientId,
				code: this.session.code,
				code_verifier: this.session.codeVerifier,
				redirect_uri: document.location.origin,
			}),
		});
		if (!res.ok) {
			console.log("SessionManager.getTokens: Failed to get tokens: " + (await res.json()));
		} else {
			const tokens = await res.json();
			this.session.idToken = tokens.id_token;
			this.session.accessToken = tokens.access_token;
			this.session.refreshToken = tokens.refresh_token;
			this.session.tokenType = tokens.token_type;
			this.session.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
			this.session.state = null;
			this.session.codeVerifier = null;
			this.session.code = null;
			this.session.save();
		}
	}
}
