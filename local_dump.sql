PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE Galleries (
        GalleryName TEXT,
        GalleryTableName TEXT PRIMARY KEY,
        TextField TEXT,
        CoverImage TEXT,
        PartyDate DATE,
        PublicationDate DATETIME,
        GalleryIsPublic BOOLEAN,
        ImagesOrder TEXT,
        Reviewers TEXT,
        Password TEXT,
        Tags TEXT,
        Location TEXT,
        UploadPasscode TEXT
      );
INSERT INTO Galleries VALUES('Engagement','engagement','','','2026-09-21','','TRUE','original','','','','','');
CREATE TABLE engagement (approved BOOLEAN, width INTEGER, height INTEGER, name TEXT, hash TEXT, path TEXT PRIMARY KEY, dateCreated INTEGER, dateModified INTEGER);
INSERT INTO engagement VALUES(1,2121,2832,'PXL_20241108_183238638','0c3c181ac769e1fe9b4439cca63ac4c85a23c9b7563db74024a4e54f32d704e7','galleries/engagement/PXL_20241108_183238638_0c3c181ac7.jpg',3791640831,2017850116);
CREATE INDEX idx_galleries_public ON Galleries(GalleryIsPublic);
CREATE INDEX idx_galleries_password ON Galleries(Password);