let cursor = db.Article.find({ code: { $regex: /С20/i } });

while (cursor.hasNext()) {

  let { code, _id } = cursor.next();

  printjson({ code, _id });

  let updated = db.Article.updateOne(
    { _id },
    {
      $set: {
        code: code.replace(/С20/, 'C20'),
      }
    }
  );

  printjson(updated);

}

printjson('ok');
