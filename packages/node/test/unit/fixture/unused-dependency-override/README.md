This is an example of an app which has a dependency but does not use it in any way. However, `policy-override.json` is present and refers to the package. The policy overrides include builtins _not explicitly used by the package_, which should not appear in auto-generation in any other case. This policy should ultimately be merged into the generated policy.