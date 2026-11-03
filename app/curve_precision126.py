"""Construct curve paths near the origin before returning them in drawing coordinates.

At survey-scale coordinates, relative equality in the path builder can mistake
opposite arc endpoints for coincident points and reverse individual Beziers.
Only transient entity copies are translated; the DWG geometry is untouched.
"""
def install():
    import ezdxf.addons.drawing.frontend as frontend
    from ezdxf.math import Matrix44, Vec3
    original=frontend.make_path
    if getattr(original,'_alcide_local126',False):return
    def local_path(entity,*args,**kwargs):
        typ=entity.dxftype();anchor=None
        if typ in ('ARC','CIRCLE','ELLIPSE'):anchor=Vec3(entity.dxf.center)
        elif typ=='LWPOLYLINE' and entity.has_arc and len(entity):
            p=entity[0];anchor=entity.ocs().to_wcs(Vec3(p[0],p[1],entity.dxf.elevation))
        elif typ=='SPLINE':
            points=entity.control_points if len(entity.control_points) else entity.fit_points
            if len(points):anchor=Vec3(points[0])
        if anchor is None or max(abs(anchor.x),abs(anchor.y),abs(anchor.z))<1e6:return original(entity,*args,**kwargs)
        local=entity.copy();local.translate(-anchor.x,-anchor.y,-anchor.z)
        return original(local,*args,**kwargs).transform(Matrix44.translate(anchor.x,anchor.y,anchor.z))
    local_path._alcide_local126=True
    frontend.make_path=local_path
