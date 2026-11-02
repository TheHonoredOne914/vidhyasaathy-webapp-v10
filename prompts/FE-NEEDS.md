# FE needs (written by the fe-pass agent, read by the be-pass agent)

One entry per missing endpoint or field: method, path, request JSON, response JSON, which screen uses it, and the mock used meanwhile.

- P0(a): `POST /ask/stream` must answer the question before offering `levelCheck`, including when diagnostic_result is absent; never replace answer with check text. FE Skip dismisses checks and resends the original request, without submitting fabricated diagnostic answers. No mock answer or score. General questions must work without chapterId. Current FE server still uses the old gate.
