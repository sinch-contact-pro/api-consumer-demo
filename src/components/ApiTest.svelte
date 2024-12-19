<script>
	import { session, sessionOk } from "../lib/session.js";

	let testedApi = "";
	let customApi = "";
	let requestStatus = "";
	let result = null;

	async function testApi(api) {
		const token = await session.getIdToken(5);
		if (!token) {
			console.log("Cannot call API without session");
			return;
		}
		testedApi = api;
		const request = {
			method: "GET",
			accept: "application/json",
			mode: "cors",
			headers: {
				Authorization: `${session.session.tokenType} ${token}`,
			},
		};
		try {
			const url = session.apiUrl + api;
			// @ts-ignore
			const res = await fetch(url, request);
			if (res.ok) {
				try {
					const data = await res.json();
					requestStatus = `${res.status}`;
					result = data;
				} catch (e) {
					requestStatus = `Call to "${api}" failed to parse due to: ${e}`;
					console.log(requestStatus);
					result = null;
				}
			} else {
				requestStatus = `Call to "${api}" failed: ${res.status} ${res.statusText}`;
				console.log(requestStatus);
				result = null;
			}
		} catch (e) {
			requestStatus = `Call to "${api}" failed to parse due to: ${e}`;
			console.log(requestStatus);
			result = null;
		}
	}
</script>

<div>
	<button
		type="button"
		on:click={() => testApi("/cmi/chats")}
		disabled={!$sessionOk}>GET /cmi/chats</button
	>
	<button
		type="button"
		on:click={() => testApi("/lri/contact")}
		disabled={!$sessionOk}>GET /lri/contact</button
	>
	<button
		type="button"
		on:click={() => testApi("/rci/users")}
		disabled={!$sessionOk}>GET /rci/users</button
	>
	<button
		type="button"
		on:click={() => testApi("/rmi/queueStatuses")}
		disabled={!$sessionOk}>GET /rmi/queueStatuses</button
	>
</div>
<div>
	<button
		type="button"
		on:click={() => testApi(customApi)}
		disabled={!$sessionOk}>GET:</button
	>
	<input bind:value={customApi} />
</div>

<pre>Tested api: "{testedApi}"</pre>
<pre>Status: {requestStatus}</pre>

<pre>Result: {JSON.stringify(result, null, "\t")}</pre>

<style>
	button {
		width: 12em;
	}
	div {
		margin-bottom: 5px;
	}
	input {
		width: 20em;
	}
</style>
