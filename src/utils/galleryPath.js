import { isEnvVarSet } from "./envVars";

export const getGalleryPath = (c) => {
    if (!isEnvVarSet(c.env, "GALLERY_PATH")) {
        console.error("GALLERY_PATH IS NOT SET");
        return "/";
    }

    if (c.env.GALLERY_PATH === "/" || c.env.GALLERY_PATH === "") {
        return "/"
    }
    return `/${c.env.GALLERY_PATH}/`;
};

export const getImagePath = (c, img) => {
    return `${getGalleryPath(c)}img/${img}`;
};

export const getImageWithTransforms = (c, img, location="main", format="auto") => {
    if (!img) return "";
    if (img.startsWith("http://") || img.startsWith("https://")) {
        return img;
    }

    let baseImgLocation;
    let cleanImg = img;
    if (cleanImg.startsWith("/gallery/img/")) {
        cleanImg = cleanImg.replace("/gallery/img/", "/img/");
    }

    if (cleanImg.startsWith("/img/")) {
        baseImgLocation = cleanImg;
    } else {
        baseImgLocation = getImagePath(c, cleanImg.replace(/^\/+/, ""));
    }

    if (c.env.IMGT === "false") {
        return baseImgLocation;
    }
    let cloudFlareBase = `/cdn-cgi/image/f=${format},metadata=copyright`;
    switch (location)
    {
        // thumbnails for sliders
        case "slider-thumb":
            cloudFlareBase += ",q=60,w=70,h=70";
        break;
        // Thumbnail for images in a gallery
        case "gallery-thumb":
        // Used for the image gallery cover images
        case "cover":
            cloudFlareBase += ",q=80,w=433,h=200,fit=scale-down";
        break;
        // Used for the global slider
        case "slider":
        // Full sized images
        case "main":
        case "full":
            cloudFlareBase += ",q=85";
        break;
    }
    return cloudFlareBase + baseImgLocation;
};