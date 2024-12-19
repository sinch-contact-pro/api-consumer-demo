<script>
	import { onMount } from "svelte";
	import { session, sessionOk } from "../lib/session.js";

	onMount(async () => {
		session.completeLogin();
	});

	async function login() {
		session.startLogin();
	}

	async function logout() {
		session.logout();
	}
</script>

<button type="button" on:click={login} disabled={$sessionOk}>Login</button>
<button type="button" on:click={logout} disabled={!$sessionOk}>Logout</button>

<style>
	button {
		width: 6em;
	}
</style>
