<script>
	import LinearProgress from '@smui/linear-progress';
	import { Rosters } from '$lib/components';

	export let data;

	const rostersInfo = data.rostersInfo;
</script>

<style>
	.holder {
		position: relative;
		z-index: 1;
	}

	.loading {
		display: block;
		width: 85%;
		max-width: 500px;
		margin: 80px auto;
	}

	.snapshotHolder {
		width: 95%;
		max-width: 1200px;
		margin: 3em auto;
	}

	.snapshotDetails {
		border: 1px solid var(--ccc);
		border-radius: 0.5em;
		padding: 1em;
	}

	.snapshotSummary {
		cursor: pointer;
		font-weight: 700;
	}

	.snapshotCode {
		white-space: pre-wrap;
		word-break: break-word;
		margin-top: 1em;
		padding: 1em;
		border: 1px solid var(--ccc);
		border-radius: 0.5em;
		font-size: 0.75em;
		overflow-x: auto;
		max-height: 800px;
		overflow-y: auto;
	}
</style>

<div class="holder">
	{#await rostersInfo}
		<div class="loading">
			<p>Retrieving roster data...</p>
			<br />
			<LinearProgress indeterminate />
		</div>

	{:then [leagueData, rosterData, leagueTeamManagers, playersInfo]}

		<Rosters
			{leagueData}
			{rosterData}
			{leagueTeamManagers}
			{playersInfo}
		/>

		<div class="snapshotHolder">
			<details class="snapshotDetails">

				<summary class="snapshotSummary">
					DEBUG: WEEK 1 ROSTER SNAPSHOT
				</summary>

				<pre class="snapshotCode">{JSON.stringify(
					{
						leagueData,
						rosterData,
						leagueTeamManagers,
						playersInfo
					},
					null,
					2
				)}</pre>

			</details>
		</div>

	{:catch error}

		<p>
			Something went wrong:
			{error.message}
		</p>

	{/await}
</div>
