<script>
	import "/src/app.css";
	import { onMount } from "svelte";

	onMount(() => {
		// Proactively unregister any service workers from previous projects on this localhost port
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker
				.getRegistrations()
				.then(function (registrations) {
					for (let registration of registrations) {
						console.log(
							"Unregistering legacy service worker:",
							registration,
						);
						registration.unregister();
					}
				});
		}
	});
</script>

<slot />
