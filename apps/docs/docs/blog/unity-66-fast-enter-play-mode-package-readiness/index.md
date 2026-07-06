---
title: "Upcoming Unity Editor Change Affecting Package Compatibility: Unity 6.6 Fast Enter Play Mode"
author: "Favo Yang"
date: "2026-07-06"
readingTime: "2 min read"
description: "Unity 6.6 enables Fast Enter Play Mode by default for new projects, so package authors should audit static state and add explicit Play Mode cleanup where needed."
cover: "/images/blog-covers/unity-66-fast-enter-play-mode-package-readiness.png"
editLink: false
---
# Upcoming Unity Editor Change Affecting Package Compatibility: Unity 6.6 Fast Enter Play Mode

<BlogPostMeta />

<figure>
  <img
    alt="Unity package compatibility cleanup illustration"
    src="/images/blog-covers/unity-66-fast-enter-play-mode-package-readiness.png"
  />
</figure>

Starting with Unity 6.6, Fast Enter Play Mode is enabled by default for new
projects. For package authors, the main compatibility change is that packages
should no longer assume entering Play Mode performs a domain reload and resets
C# static state.

When domain reload is disabled, static fields and static event subscriptions can
survive between Play Mode sessions. This is good for iteration time, but it can
expose hidden assumptions in packages that keep mutable static state, static
singletons, static caches, static Unity object references, or static events.

If you maintain a package, the practical migration path is:

1. Audit mutable static fields and static singletons.
2. Check static caches, especially caches that store Unity objects or objects
   created during Play Mode.
3. Review static events and delegates so stale subscribers do not accumulate
   between Play Mode runs.
4. Add explicit reset or cleanup code where the package expects a fresh Play
   Mode session.

Unity's migration-style manual page,
[Enter Play mode without domain reload](https://docs.unity3d.com/6000.6/Documentation/Manual/domain-reloading.html),
is the best starting point. It explains what persists when domain reload is
off, when manual cleanup is needed, and how Unity's automatic static cleanup
attributes work.

For packages that support Unity 6000.5 or newer, Unity provides lifecycle APIs
for this cleanup. Use
[`OnEnteringPlayModeAttribute`](https://docs.unity3d.com/6000.5/Documentation/ScriptReference/OnEnteringPlayModeAttribute.html)
when a package needs to initialize or reset systems as Play Mode starts, and
use
[`AutoStaticsCleanupAttribute`](https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Unity.Scripting.LifecycleManagement.AutoStaticsCleanupAttribute.html)
for static fields that should be cleaned up automatically.

Because these APIs are only available in Unity 6000.5 and newer, packages that
also support older Unity versions should guard the new attribute with a version
define:

```csharp
using Unity.Scripting.LifecycleManagement;
using UnityEngine;

public partial class MyCounterClass : MonoBehaviour
{
#if UNITY_6000_5_OR_NEWER
    [AutoStaticsCleanup]
#endif
    public static int cleanedUpCounter = 0;

    private void Start()
    {
        Debug.Log(cleanedUpCounter);
        cleanedUpCounter++;
    }
}
```

For implementation details and ordering, refer to Unity's
[Domain and scene reload execution order reference](https://docs.unity3d.com/6000.6/Documentation/Manual/configurable-enter-play-mode-details.html).
That page shows which steps Unity runs or skips as domain reload and scene
reload settings change.

This Play Mode change is also part of a broader Unity runtime transition. If
your package depends on low-level runtime behavior, reflection, generated code,
or editor/runtime boundary assumptions, also read Unity's
[Path to CoreCLR, 2026: Upgrade Guide](https://discussions.unity.com/t/path-to-coreclr-2026-upgrade-guide/1714279)
for wider migration context.

For OpenUPM package maintainers, this is a good time to add a compatibility
pass to your next package release: test repeated Play Mode entry in a Unity 6.6
project, verify that package state starts clean each time, and keep the cleanup
code conditional when your package still supports older Unity versions.

<BlogPostNav />
