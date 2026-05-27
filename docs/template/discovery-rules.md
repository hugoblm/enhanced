# Discovery — The Rules

The **discovery** stage qualifies a *need* before we commit to building anything. It is the top
of the funnel and the first gate. One discovery can lead to one initiative — or to none.

```
docs/discovery_{name}/<need>.md  ──►  Go / No-Go / Pivot  ──►  on "Go": create docs/initiative_{name}/
```

## How to run a discovery

1. Copy the template: `docs/template/discovery.md` → `docs/discovery_{name}/<need-name>.md`
   (kebab-case, e.g. `self-serve-data-access.md`).
2. Work it with the FOCUSED framework. The point is to **challenge and verify the need** — not to
   design a solution. Tag every claim `[Evidence]` / `[Assumption]` / `[To verify]`.
3. Reach an explicit decision in the gate: **Go / No-Go / Pivot**.

## The gate

- **Go** → create an initiative: copy `docs/template/_initiative/` to
  `docs/initiative_{name}/`, and link *this* discovery from the initiative README + PRD gate.
- **No-Go** → keep the discovery file here, status `Rejected`, with the reason. A No-Go is a
  **success**: it saved us from building the wrong thing. This is the institutional memory of what
  we decided *not* to do, and why.
- **Pivot** → reframe and iterate within the same file.

## Why discoveries live here (not inside an initiative)

A No-Go never becomes an initiative, so it needs a home of its own. Keeping every discovery in
`docs/discovery_{name}/` means the qualification trail — including the rejections — survives regardless
of what got built.

> **For agents:** never skip discovery to jump to a solution. If asked to build something with no
> linked, validated discovery, say so and ask — don't invent the justification.
