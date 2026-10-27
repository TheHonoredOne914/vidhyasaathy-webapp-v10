Do NOT run git/npm. Edit only apps/web/src/landing/**, apps/web/src/routes/Landing.tsx, apps/web/src/auth/**. Terse.
Remaining overlaps from screenshots:
1) Landing: the Saathy cloud covers the end of the 'this is Saathy' label; put the label left of the cloud with >=12px gap, arrow curving from label to cloud, no overlap. At 1280x800 the hero subtitle runs under the phone's left edge: constrain hero text column max-width so there is >=32px gap before the phone.
2) Sign-in (auth): the role tabs (Student/Teacher/School Admin) overlap the 'Pick your divider, then write in your details.' subtitle; add spacing so subtitle sits fully above the tabs. The dark side panel is cut at the bottom at 1440x900 and 1280x800: make it fit (height: calc(100vh - nav), content inside, text fully visible).
