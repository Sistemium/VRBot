let cursor = db.FileRename.aggregate([
  {
    $lookup: {
      from: 'Picture',
      localField: 'oldName',
      foreignField: 'name',
      as: 'pictures',
    }
  },
  {
    $addFields: {
      picturesCount: { $size: '$pictures' },
    },
  },
  {
    $match: {
      picturesCount: { $gt: 0 },
    },
  },
]);

while (cursor.hasNext()) {

  let fileRename = cursor.next();

  printjson(fileRename.oldName);

  let renamed = fileRename.newName;

  let updated = db.Picture.updateMany(
    { name: fileRename.oldName },
    {
      $set: {
        renamed: renamed,
        article: renamed.match(/([^_.]+).+(png|tif[f]?|jp[e]?g)$/i)[1],
      }
    }
  );

  printjson(updated);

}

printjson('ok');
