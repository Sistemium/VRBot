#!/usr/bin/env bash

entities=(
Article
ArticleFrameSize
ArticleImage
Baguette
BaguetteColour
BaguetteImage
SaleOrder
SaleOrderPosition
User
Material
FrameSize
BackMount
Screening
Surface
Brand
Colour
Entity
)


for name in ${entities[@]}
do

	echo ${name}

  http https://vr.sistemium.com/api/${name} \
    authorization:${ACT} x-page-size:10000 > ~/Downloads/vr.${name}.json

  ll ~/Downloads/vr.${name}.json

  mongoimport --uri mongodb://mng2.sistemium.net/VR \
    --mode merge \
    --upsertFields id \
    --collection ${name} ~/Downloads/vr.${name}.json \
    --jsonArray

done



