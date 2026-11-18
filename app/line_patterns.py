"""Shared numbered CAD line patterns; generated alongside line-patterns107.js."""
STANDARD = {'ALCIDE_01': [0], 'ALCIDE_02': [2.8, 2, -0.8], 'ALCIDE_03': [5, 4, -1], 'ALCIDE_04': [10, 8, -2], 'ALCIDE_05': [11, 8, -1, 1, -1], 'ALCIDE_06': [13, 8, -1, 1, -1, 1, -1], 'ALCIDE_07': [22, 16, -2, 2, -2], 'ALCIDE_08': [26, 16, -2, 2, -2, 2, -2], 'ALCIDE_09': [1.05, 0.05, -1], 'ALCIDE_10': [4.2, 2, -0.7, 0.05, -0.7, 0.05, -0.7], 'ALCIDE_11': [7.249999999999999, 6, -0.6, 0.05, -0.6], 'ALCIDE_12': [10.95, 8, -0.7, 0.05, -0.7, 0.05, -0.7, 0.05, -0.7], 'ALCIDE_13': [28.05, 10, -10, 2, -3, 0.05, -3], 'ALCIDE_14': [31.05, 10, -10, 2, -4, 0.05, -5], 'ALCIDE_15': [3.0, 0.7, -2.3], 'ALCIDE_16': [5.0, 2.5, -2.5], 'ALCIDE_17': [2.35, 0.7, -0.8, 0.05, -0.8], 'ALCIDE_18': [2.05, 0.05, -2], 'DASHED': [1.4, 0.9, -0.5], 'DOTTED': [0.5, 0.02, -0.48], 'CENTER': [2.2, 1.2, -0.4, 0.2, -0.4]}

def ensure(doc, name):
    name = str(name)
    key = name.upper()
    if key in ("BYLAYER", "BYBLOCK"):
        return key
    if name in doc.linetypes:
        return name
    if key in STANDARD:
        doc.linetypes.new(key, dxfattribs={"description": "ALCIDE - type " + key, "pattern": STANDARD[key]})
        return key
    raise ValueError("Type de trait inconnu : " + name)

STANDARD.update({'ALCIDE_19': [15.100000000000001, 12, -1, 0.05, -1, 0.05, -1], 'ALCIDE_20': [23, 18, -1, 3, -1], 'ALCIDE_21': [24, 20, -4], 'ALCIDE_22': [0.43000000000000005, 0.03, -0.4], 'ALCIDE_23': [9.05, 3, -1, 3, -1, 0.05, -1], 'ALCIDE_24': [13.05, 3, -1, 3, -1, 3, -1, 0.05, -1], 'ALCIDE_25': [14.200000000000006, 10, -0.8, 0.05, -0.8, 0.05, -0.8, 0.05, -0.8, 0.05, -0.8], 'ALCIDE_26': [19, 8, -2, 4, -2, 1, -2]})

def complex_pattern(linetype):
    """1.0.87 : motif tiret/espace des types de traits complexes (texte ou forme intégrés).
    ezdxf les rend continus ; on garde les longueurs des éléments (le texte ou la forme occupe l'espace)."""
    try:
        values = [float(t.value) for t in linetype.pattern_tags.tags if t.code == 49]
    except Exception:
        return ()
    if len(values) < 2:
        return ()
    out = []
    for v in values:
        dash = v >= 0
        size = abs(v)
        if out and (len(out) % 2 == 1) == dash:
            out[-1] += size
        else:
            if not out and not dash:
                out.append(0.0)
            out.append(size)
    if len(out) % 2:
        out.append(0.0)
    if sum(out) <= 1e-12:
        return ()
    return tuple(out)

def render_pattern(linetype):
    """Motif simplifié (tiret, espace, ...) : ezdxf pour les types simples, complex_pattern sinon."""
    try:
        pattern = tuple(linetype.simplified_line_pattern())
    except Exception:
        pattern = ()
    return pattern or complex_pattern(linetype)
