<script lang="ts">import '../app.css'; import { base } from '$app/paths'; import { page } from '$app/state'; let { children } = $props(); let route=$derived(page.url.pathname.slice(base.length)||'/');</script>
<a class="skip-link" href="#main">Skip to content</a>
{#if !['/play/','/table/','/hand/','/play','/table','/hand'].includes(route)}
<header class="site-header"><a class="wordmark" href={base + '/'}>sa<span>boba</span>tage<span class="brand-dot">●</span></a><nav aria-label="Main navigation"><a href={base + '/play/'} aria-current={['/play/','/table/','/hand/'].includes(route) ? 'page' : undefined}>Play</a><a href={base + '/gallery/'} aria-current={['/','/gallery/'].includes(route) ? 'page' : undefined}>Card gallery</a><a href={base + '/rules/'} aria-current={route.startsWith('/rules') ? 'page' : undefined}>How to play <span>↗</span></a></nav><span class="edition"><i></i> TEA · TOPPINGS · TREACHERY</span></header>
{/if}
{@render children()}
{#if !['/play/','/table/','/hand/','/play','/table','/hand'].includes(route)}
<footer class="site-footer"><a class="wordmark" href={base + '/'}>sabobatage<span class="brand-dot">●</span></a><span>Made of tea, tiny pearls, and questionable intentions.</span><small>UNOFFICIAL LOCAL PROTOTYPE</small></footer>

{/if}
