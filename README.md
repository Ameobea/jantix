# Jantix

![NPM version badge for jantix](https://img.shields.io/npm/v/jantix.svg?style=flat-square)
![Last commit badge](https://img.shields.io/github/last-commit/ameobea/jantix.svg?style=flat-square)

Jantis is a fully-featured TypeScript library that defines a self-contained, 100% type-safe Redux architecture. It allows for stores following a common pattern to be easily defined, merged, and used through the native Redux interfact with type safety and consistency guarentees automatically applied.

In addition to enforcing a typed interface for interacting with the created store, it also provides many useful guarentees about the validity of the provided actions/reducers by preventing mismatches between action types, invalid actions, and mal-formed reducers all at compile-time.

## Installation

`yarn add jantix`

or

`npm install --save jantix`

## Usage / Example

Check out `examples/basic.ts` for an example of how to use jantix.
