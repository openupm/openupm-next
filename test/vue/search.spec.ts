import { describe, it } from 'vitest';
import chai from "chai";
const assert = chai.assert;
chai.should();
import { usePackageSearchSuggestions } from '@/search'

describe('usePackageSearchSuggestions', () => {
  it('should return an empty array for an empty query', () => {
    const searchIndex = [] as any[];
    const query = '';
    const suggestions = usePackageSearchSuggestions(searchIndex, query);
    suggestions.should.be.an('array').that.is.empty;
  });

  it('should return an array of package search suggestions for a single query token', () => {
    const searchIndex = [
      {
        path: '/packages/com.example.package1/',
        pathLocale: '/',
        title: 'package1',
        extraFields: [],
        headers: [],
      },
      {
        path: '/packages/com.example.package2/',
        pathLocale: '/',
        title: 'package2',
        extraFields: [],
        headers: [],
      },
      {
        path: '/packages/topics/2d/',
        pathLocale: '/',
        title: 'topics - 2d',
        extraFields: [],
        headers: [],
      },
    ];
    const query = 'package1';
    const suggestions = usePackageSearchSuggestions(searchIndex, query);
    suggestions.should.be.an('array').that.has.lengthOf(1);
    suggestions[0].should.deep.equal({ name: 'com.example.package1' });
  });

  it('should return an array of package search suggestions for multiple query tokens', () => {
    const searchIndex = [
      {
        path: '/packages/com.example.package1/',
        pathLocale: '/',
        title: 'fetch rest',
        extraFields: [],
        headers: [],
      },
      {
        path: '/packages/com.example.package2/',
        pathLocale: '/',
        title: 'rest fetch',
        extraFields: [],
        headers: [],
      },
      {
        path: '/packages/topics/2d/',
        pathLocale: '/',
        title: 'topics - 2d',
        extraFields: [],
        headers: [],
      },
    ];
    const query = 'fetch rest';
    const suggestions = usePackageSearchSuggestions(searchIndex, query);
    suggestions.should.be.an('array').that.has.lengthOf(2);
    suggestions[0].should.deep.equal({ name: 'com.example.package1' });
    suggestions[1].should.deep.equal({ name: 'com.example.package2' });
  })

  it('should return an array of package search suggestions for multiple query tokens that contains plural words', () => {
    const searchIndex = [
      {
        path: '/packages/com.example.package1/',
        pathLocale: '/',
        title: 'fetches',
        extraFields: [],
        headers: [],
      },
      {
        path: '/packages/com.example.package2/',
        pathLocale: '/',
        title: 'fetch',
        extraFields: [],
        headers: [],
      }
    ];
    const query = 'fetches';
    const suggestions = usePackageSearchSuggestions(searchIndex, query);
    suggestions.should.be.an('array').that.has.lengthOf(2);
    suggestions[0].should.deep.equal({ name: 'com.example.package1' });
    suggestions[1].should.deep.equal({ name: 'com.example.package2' });
  })

  it('should return an empty array of package search suggestions for multiple query tokens that don\'t get matched', () => {
    const searchIndex = [
      {
        path: '/packages/com.example.package1/',
        pathLocale: '/',
        title: 'fetch api',
        extraFields: [],
        headers: [],
      },
      {
        path: '/packages/com.example.package2/',
        pathLocale: '/',
        title: 'rest api',
        extraFields: [],
        headers: [],
      },
      {
        path: '/packages/topics/2d/',
        pathLocale: '/',
        title: 'topics - 2d',
        extraFields: [],
        headers: [],
      },
    ];
    const query = 'fetch rest';
    const suggestions = usePackageSearchSuggestions(searchIndex, query);
    suggestions.should.be.an('array').that.is.empty;
  })
});