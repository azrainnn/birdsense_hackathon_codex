"""Curated, display-safe field-guide profiles for BirdSense species.

The range regions intentionally describe broad Sarawak landscapes rather than
observation points. They are a discovery aid, not a source of occurrence data,
and must not be used to locate nests, roosts, or threatened wildlife.
"""

from __future__ import annotations

from copy import deepcopy


_NOTICE = (
    "Generalised Sarawak habitat guide only — it is not an occurrence map. "
    "Check a current authoritative conservation source before making a field decision."
)


def _profile(
    summary: str,
    habitat: str,
    call_description: str,
    tips: list[str],
    conservation_status: str,
    distribution_summary: str,
    regions: list[str],
    *,
    sensitive: bool = False,
) -> dict[str, object]:
    return {
        "summary": summary,
        "habitat": habitat,
        "call_description": call_description,
        "identification_tips": tips,
        "conservation_status": conservation_status,
        "conservation_note": _NOTICE,
        "distribution_summary": distribution_summary,
        "range_regions": regions,
        "sensitive_location": sensitive,
    }


# Status labels are field-guide context, deliberately paired with the notice
# above. Refresh them from the IUCN Red List before a public production launch.
PROFILES: dict[str, dict[str, object]] = {
    "bornean_black_magpie": _profile(
        "A striking, dark Bornean forest corvid with a long tail and a distinctive pale eye.",
        "Lowland and lower-montane primary or mature secondary forest.",
        "Harsh, varied calls often delivered from the mid-storey or canopy.",
        ["Listen for a varied, crow-like series rather than one pure whistle.", "Most useful clues are a mature-forest setting and repeated calls."],
        "Near Threatened — verify before publication",
        "Broadly associated with mature forest landscapes in western, central and northern Sarawak.",
        ["Kuching & western lowlands", "Rajang basin", "Ulu Baram & Mulu"],
    ),
    "white-crowned_shama": _profile(
        "A secretive forest songbird, best known for a rich and highly variable song.",
        "Understorey and edges of lowland forest, gardens and regenerating woodland.",
        "Clear whistles and melodic phrases, often with mimicry or changing motifs.",
        ["Compare the rhythm across several phrases; songs can vary strongly.", "Check understorey habitat before relying on the top prediction."],
        "Least Concern — verify before publication",
        "A broad lowland forest and edge species; the map gives only general regional context.",
        ["Kuching & western lowlands", "Bintulu & central lowlands", "Rajang basin"],
    ),
    "bold-striped_tit-babbler": _profile(
        "A small, active Bornean babbler that usually travels through dense vegetation.",
        "Lowland forest understorey, scrub and tangled secondary growth.",
        "Short, thin chatter and quick repeated notes from low cover.",
        ["Calls may be mixed with other understorey birds.", "Use habitat and multiple short call bursts to verify."],
        "Least Concern — verify before publication",
        "Generalised to lowland forest and secondary-growth landscapes across much of Sarawak.",
        ["Kuching & western lowlands", "Bintulu & central lowlands", "Rajang basin"],
    ),
    "blue-eared_barbet": _profile(
        "A colourful canopy barbet whose repeated calls can carry well through forest.",
        "Lowland and hill forest, forest edge and fruiting trees.",
        "Repetitive, emphatic notes or rolling calls, usually from the canopy.",
        ["Barbets can be acoustically similar; inspect the top alternatives.", "Repeated, evenly spaced calls are more informative than a single note."],
        "Least Concern — verify before publication",
        "A broad lowland and hill-forest guide for western, central and northern Sarawak.",
        ["Kuching & western lowlands", "Bintulu & central lowlands", "Ulu Baram & Mulu"],
    ),
    "black-crowned_pitta": _profile(
        "A vividly coloured, ground-dwelling pitta associated with intact Bornean forest.",
        "Leaf litter and lower strata of lowland to foothill rainforest.",
        "Loud, deliberate whistles or paired notes that may be widely spaced.",
        ["Avoid publishing exact locations for sensitive forest birds.", "Confirm with repeated calls and appropriate intact-forest habitat."],
        "Vulnerable — verify before publication",
        "Shown only as broad intact-forest regions; no fine-scale occurrence information is displayed.",
        ["Kuching & western lowlands", "Rajang basin", "Ulu Baram & Mulu"],
        sensitive=True,
    ),
    "golden-naped_barbet": _profile(
        "A compact Bornean barbet associated with upland forest and fruiting trees.",
        "Hill and montane forest, especially along forested ridges.",
        "Repeated barbet-like notes, often forming a steady cadence.",
        ["Altitude and forest type help separate this species from lowland barbets.", "Check for consistency across several repeated notes."],
        "Least Concern — verify before publication",
        "Generalised to upland and interior forest systems rather than exact sites.",
        ["Usun Apau & Kelabit Highlands", "Ulu Baram & Mulu"],
    ),
    "bornean_treepie": _profile(
        "A Bornean endemic corvid with noisy social calls and an affinity for forested hills.",
        "Hill and montane forest, forest edge and clearings near mature woodland.",
        "Loud, variable corvid calls, chatter and squawks.",
        ["Listen for several individuals or a moving group where possible.", "Separate from other corvids using the full recording and habitat."],
        "Near Threatened — verify before publication",
        "A broad interior and upland-forest guide for Sarawak.",
        ["Usun Apau & Kelabit Highlands", "Ulu Baram & Mulu", "Rajang basin"],
    ),
    "blue-headed_pitta": _profile(
        "A shy Bornean forest pitta that is more often heard than seen.",
        "Dark, humid lowland and foothill rainforest understorey.",
        "A distinctive, spaced whistle or resonant repeated note from cover.",
        ["Record several calls before treating a match as confirmed.", "Do not attach precise locations to public records."],
        "Near Threatened — verify before publication",
        "Only broad forest landscapes are represented because this is a sensitive understorey species.",
        ["Kuching & western lowlands", "Rajang basin", "Ulu Baram & Mulu"],
        sensitive=True,
    ),
    "greater_racket-tailed_drongo": _profile(
        "A vocal drongo with exceptional mimicry and long racket-shaped outer tail feathers.",
        "Lowland and hill forest, forest edge and tall secondary woodland.",
        "An unpredictable medley of whistles, metallic notes and mimicked calls.",
        ["Mimicry can trigger false positives; inspect competing candidates.", "Longer recordings give the model a fairer chance with this species."],
        "Least Concern — verify before publication",
        "A general lowland and hill-forest guide across Sarawak.",
        ["Kuching & western lowlands", "Bintulu & central lowlands", "Ulu Baram & Mulu"],
    ),
    "rhinoceros_hornbill": _profile(
        "Sarawak's iconic large hornbill, strongly associated with old forest and large fruiting trees.",
        "Mature lowland and hill rainforest with large canopy trees.",
        "Deep, far-carrying honks, grunts and harsh calls; wingbeats may also be audible.",
        ["A clear multi-note sequence is more reliable than a distant single honk.", "Treat public sightings responsibly and avoid nesting-site detail."],
        "Vulnerable — verify before publication",
        "A broad mature-forest range guide for Sarawak's western, central and northern interiors.",
        ["Kuching & western lowlands", "Rajang basin", "Ulu Baram & Mulu"],
        sensitive=True,
    ),
    "rufous-crowned_babbler": _profile(
        "A quiet, lowland Bornean babbler that forages in the shaded understorey.",
        "Lowland rainforest understorey and mature secondary forest.",
        "Soft chatter, short calls and thin whistles from dense cover.",
        ["Use a clear recording with little insect noise.", "Review other babbler candidates when confidence is modest."],
        "Least Concern — verify before publication",
        "Generalised to broad lowland forest systems in western and central Sarawak.",
        ["Kuching & western lowlands", "Bintulu & central lowlands", "Rajang basin"],
    ),
    "white-chested_babbler": _profile(
        "A scarce Bornean babbler of mature lowland forest, most often detected by voice.",
        "Dense understorey of intact lowland rainforest.",
        "Quiet, subtle chatter and short notes that can be difficult to isolate.",
        ["Mark uncertain results for expert review.", "Never expose fine-scale locations for potentially sensitive forest birds."],
        "Vulnerable — verify before publication",
        "Only broad mature-forest landscapes are shown to protect sensitive occurrence information.",
        ["Kuching & western lowlands", "Bintulu & central lowlands", "Rajang basin"],
        sensitive=True,
    ),
    "bornean_banded_pitta": _profile(
        "A Bornean endemic pitta of deep forest floor and thick low vegetation.",
        "Lowland to foothill rainforest, especially shaded forest-floor habitat.",
        "Loud, measured whistles or resonant paired notes from the understorey.",
        ["Verify using multiple notes and forest context.", "Keep field notes general; this app intentionally avoids precise map points."],
        "Near Threatened — verify before publication",
        "A restricted, generalised guide to forested areas in western, central and northern Sarawak.",
        ["Kuching & western lowlands", "Rajang basin", "Ulu Baram & Mulu"],
        sensitive=True,
    ),
    "bornean_ground_cuckoo": _profile(
        "An elusive, ground-dwelling Bornean forest species whose records require particular care.",
        "Remote, intact lowland and foothill rainforest with dense forest-floor cover.",
        "Low, unusual calls that should be reviewed by an expert before being treated as a record.",
        ["Always submit an uncertain match for expert review.", "Do not publish precise location, time or access details."],
        "Critically Endangered — verify before publication",
        "The app intentionally presents only a very broad interior-forest indication, never occurrence points.",
        ["Ulu Baram & Mulu", "Rajang basin"],
        sensitive=True,
    ),
    "bornean_bristlehead": _profile(
        "A distinctive Bornean canopy bird often encountered in small, active groups.",
        "Mature lowland and foothill rainforest, usually in the canopy.",
        "High, nasal or chattering group calls, often accompanied by movement through the canopy.",
        ["A sequence with multiple group members is more reliable than one isolated call.", "Avoid publishing precise public coordinates for sensitive records."],
        "Vulnerable — verify before publication",
        "A broad mature-forest guide for central and northern Sarawak.",
        ["Bintulu & central lowlands", "Rajang basin", "Ulu Baram & Mulu"],
        sensitive=True,
    ),
}


def get_profile(species_name: str) -> dict[str, object] | None:
    """Return a defensive copy so routes cannot mutate the source guide."""
    profile = PROFILES.get(species_name)
    return deepcopy(profile) if profile else None
