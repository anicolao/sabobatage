<script lang="ts">import '../app.css'; import { page } from '$app/state'; let { children } = $props();</script>
<a class="skip-link" href="#main">Skip to content</a>
{#if !['/play/','/table/','/hand/','/play','/table','/hand'].includes(page.url.pathname)}
<header class="site-header"><a class="wordmark" href="/">sa<span>boba</span>tage<span class="brand-dot">●</span></a><nav aria-label="Main navigation"><a href="/play/" aria-current={['/play/','/table/','/hand/'].includes(page.url.pathname) ? 'page' : undefined}>Play</a><a href="/gallery/" aria-current={['/','/gallery/'].includes(page.url.pathname) ? 'page' : undefined}>Card gallery</a><a href="/rules/" aria-current={page.url.pathname.startsWith('/rules') ? 'page' : undefined}>How to play <span>↗</span></a></nav><span class="edition"><i></i> TEA · TOPPINGS · TREACHERY</span></header>
{/if}
{@render children()}
{#if !['/play/','/table/','/hand/','/play','/table','/hand'].includes(page.url.pathname)}
<footer class="site-footer"><a class="wordmark" href="/">sabobatage<span class="brand-dot">●</span></a><span>Made of tea, tiny pearls, and questionable intentions.</span><small>UNOFFICIAL LOCAL PROTOTYPE</small></footer>

{/if}
