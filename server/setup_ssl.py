#!/bin/bash

outdir='ssl'
mkdir $outdir 2> /dev/null

genKey() {
  openssl genrsa -des3 -out $outdir/$target.key 2048
  openssl rsa -in $outdir/$target.key -out $outdir/$target.key
  openssl req -sha256 -new -key $outdir/$target.key -out \
  $outdir/$target.csr -subj '/CN=localhost'
  openssl x509 -req -days 365 -in $outdir/$target.csr \
  -signkey $outdir/$target.key -out $outdir/$target.crt
}       
        
target='server'
genKey
