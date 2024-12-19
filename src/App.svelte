<script>
	import ApiTest from "./components/ApiTest.svelte";
	import LoginButton from "./components/LoginButton.svelte";
	import { configuration } from "./configuration.js";
	import { session } from "./lib/session.js";

	session.init("api-consumer-demo", configuration);
</script>

<main>
	<h1>Demo App - Use Contact Pro API with SSO</h1>
	<div>
		<span>Session:</span>
		<LoginButton />
		<hr />
		<ApiTest />
	</div>
</main>

<style>
	h1 {
		background-color: azure;
		font-size: larger;
		padding: 5px;
		text-align: center;
	}
	div {
		padding: 5px;
	}
</style>
