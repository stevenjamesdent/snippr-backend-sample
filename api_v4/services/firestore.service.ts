import CONSTANTS from "../../constants";

import { CollectionReference, Query } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { QueryParam, QuerySorting } from '../../types/types.firebase';

export default class FirestoreService {
    db: admin.firestore.Firestore;
    collection_name: string;
    archive_collection: CollectionReference;
    collection: CollectionReference;

    constructor(collection_name: string) {
        this.db = admin.firestore();
        this.collection_name = collection_name;
        this.archive_collection = this.db.collection(CONSTANTS.SETTINGS.COLLECTIONS.ARCHIVE);
        this.collection = this.db.collection(this.collection_name);
    }

    archive = (uuid: string, data: object, metadata: object | null = null) => {
        return this.archive_collection.doc(uuid).set({
            ...data,
            [CONSTANTS.FIELDS.ARCHIVE.ORIGINAL_COLLECTION]: this.collection_name,
            [CONSTANTS.FIELDS.ARCHIVE.ARCHIVE_TIMESTAMP]: new Date(),
            [CONSTANTS.FIELDS.ARCHIVE.METADATA]: metadata,
        });
    }

    count_by = async (params: QueryParam[], foreign_collection = null) => {
        let query: Query = foreign_collection ? await foreign_collection : await this.collection;
        
        for (const param of params) {
            const param_value = await param.value == 'true' ? true 
                                    : param.value == 'false' ? false
                                    : param.value;
                                    
            query = query.where(
                param.field, param.operator, param_value
            );
        }

        return query.count().get().then(query_snapshot => {
            return query_snapshot.data().count;
        });
    }

    delete_by_id = async (id: string) => {
        if (!id) throw new Error('Missing required parameter id');
        
        const bulk_writer = this.db.bulkWriter();
        const target_document = this.collection.doc(id);

        bulk_writer.onWriteError((error) => {
            if (error.failedAttempts < 5) {
                return true;
            }
            else {
                console.log('Failed write action in bulkWriter for delete_by_id at document: ', error.documentRef.path);
                return false;
            }
        });

        return this.db.recursiveDelete(target_document, bulk_writer);
    }

    document_exists = (id: string) => {
        return this.collection.doc(id).get().then(document => {
            if (document.exists) {
                return true;
            }
            else {
                return false;
            }
        });
    }

    get_by_id = async (id: string, foreign_collection: CollectionReference | null = null) : Promise<any | null> => {
        if (!id) throw new Error('Missing required parameter id');

        const collection = foreign_collection ?? this.collection;

        return collection.doc(id).get().then(document_snapshot => {
            const document_data = document_snapshot.data();

            return document_data ? {
                ...document_data,
                id: id
            } : null;
        });
    }

    select_all = async (sorting?: QuerySorting) => {
        let results: object[] = [];
        let query: Query = await this.collection;

        if (sorting) {
            query = query.orderBy(sorting.field, sorting.order ?? 'asc');
        }
        
        await query.get().then(query_snapshot => {
            query_snapshot.forEach(document_snapshot => {
                const result = {
                    ...document_snapshot.data(),
                    id: document_snapshot.id
                }

                results.push(result);
            });
        });

        return results;
    }

    select_by = async (params: QueryParam[], sorting?: QuerySorting, foreign_collection = null) : Promise<any[] | null> => {
        let results: object[] = [];
        let query: Query = foreign_collection ? await foreign_collection : await this.collection;
        
        for (const param of params) {
            const param_value = await param.value == 'true' ? true 
                                    : param.value == 'false' ? false
                                    : param.value;
                                    
            query = query.where(
                param.field, param.operator, param_value
            );
        }

        if (sorting) {
            query = query.orderBy(sorting.field, sorting.order ?? 'asc');
        }
        
        await query.get().then(query_snapshot => {
            query_snapshot.forEach(document_snapshot => {
                const result = {
                    ...document_snapshot.data(),
                    id: document_snapshot.id
                }

                results.push(result);
            });
        }).catch((error) => {
            throw new Error(error);
        });
        
        return results;
    }

    select_by_geohash_bounds = (geohash_bounds: [], geohash_field: string) => {
        let results: object[] = [];

        return Promise.all(
            geohash_bounds.map((bound) =>
                this.collection.orderBy(geohash_field).startAt(bound[0]).endAt(bound[1])
                    .get().then((query_snapshot) => {
                        query_snapshot.forEach(document_snapshot => {
                            const result = {
                                ...document_snapshot.data(),
                                id: document_snapshot.id
                            }
            
                            results.push(result);
                        });
                    })
            )
        ).then(() => results);
    }

    update_by_id = async (id: string, data: object) => {
        if (!id) throw new Error('Missing required parameter id');
        if (!data) throw new Error('Missing required parameter data');

        const document_exists = await this.document_exists(id);

        if (document_exists) {
            return this.collection.doc(id).update(data);
        } else {
            return this.write_by_id(id, data);
        }
    }

    write = async (data: object) => {
        return new Promise((resolve, reject) => {
            this.collection.add(data).then((document_reference) => {
                resolve(document_reference.id);
            });
        })
    }

    write_by_id = async (id: string, data: object) => {
        if (!id) throw new Error('Missing required parameter id');
        if (!data) throw new Error('Missing required parameter data');

        return this.collection.doc(id).set(data).then(() => id);
    }
}