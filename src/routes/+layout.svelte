<script lang="ts">import '../app.css'; import { page } from '$app/state'; let { children } = $props();</script>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><a class="wordmark" href="/">sa<span>boba</span>tage<span class="brand-dot">●</span></a><nav aria-label="Main navigation"><a href="/gallery/" aria-current={page.url.pathname.startsWith('/rules') ? undefined : 'page'}>Card gallery</a><a href="/rules/" aria-current={page.url.pathname.startsWith('/rules') ? 'page' : undefined}>How to play <span>↗</span></a></nav><span class="edition"><i></i> ART DIRECTION · 01</span></header>
{@render children()}
<footer class="site-footer"><a class="wordmark" href="/">sabobatage<span class="brand-dot">●</span></a><span>Made of tea, tiny pearls, and questionable intentions.</span><small>UNOFFICIAL LOCAL PROTOTYPE</small></footer>
