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

    it('should return an array of package search suggestions for a non-empty query', () => {
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

});