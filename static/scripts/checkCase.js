db.getCollection('Picture').aggregate([
  { $addFields: { articleUpper: { $toUpper: '$article' }}},
  { $addFields: { isUpper: { $cmp: [ '$articleUpper', '$article' ]}}},
  { $match: { isUpper: { $ne: 0 }}}
]);

db.getCollection('Baguette').aggregate([
  { $addFields: { codeUpper: { $toUpper: '$code' }}},
  { $addFields: { isUpper: { $cmp: [ '$codeUpper', '$code' ]}}},
  { $match: { isUpper: { $ne: 0 }}}
]);
