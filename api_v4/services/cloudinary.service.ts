import CONSTANTS from '../../constants';

import { v2 as cloudinary } from 'cloudinary';
import FirestoreService from "./firestore.service";
import path from 'path';
import SnipprID from "../utils/snipprid.util";
import { Media } from '../../types/types.media';

export default class CloudinaryService {
    firestore: FirestoreService;
    root: string;
    snippr_id: SnipprID;

    constructor() {
        this.firestore = new FirestoreService(CONSTANTS.SETTINGS.COLLECTIONS.MEDIA);
        this.root = CONSTANTS.SETTINGS.MEDIA.DIRECTORIES.ROOT;
        this.snippr_id = new SnipprID(CONSTANTS.SETTINGS.UUIDS.FILE);

        cloudinary.config({
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_SECRET,
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            secure: true,
        });
    }

    #id = (filepath: string) => {
        return this.snippr_id.generate_id(filepath);
    }

    #create_asset_record = (user_id: string, directory: string | null, filename: string | null, version: string | number) => {
        const filepath = this.#path(user_id, directory, filename);

        return this.firestore.write_by_id(
            this.#id(filepath),
            {
                [CONSTANTS.FIELDS.MEDIA.DIRECTORY]: directory,
                [CONSTANTS.FIELDS.MEDIA.FILENAME]: filename,
                [CONSTANTS.FIELDS.MEDIA.PATH]: filepath,
                [CONSTANTS.FIELDS.MEDIA.TIMESTAMP]: new Date(),
                [CONSTANTS.FIELDS.MEDIA.USER_ID]: user_id,
                [CONSTANTS.FIELDS.MEDIA.VERSION]: version,
            }
        );
    }

    #deconstruct_path = (filepath_or_url: string) => {
        const filepath = filepath_or_url.substring(filepath_or_url.indexOf(this.root));
        const path_elements = filepath.split('/');
        const root_index = path_elements.indexOf(this.root);
        const user_id = path_elements[root_index + 1];
        const filename = path.basename(filepath);
        const dirname = path.dirname(filepath).replace(`${this.root}/${user_id}`, '').replace(/^\//g, '');
        const directory = dirname?.length ? dirname : null;

        return {
            directory,
            filename,
            user_id,
        };
    }

    #delete_asset_record = (user_id: string, directory: string | null, filename: string | null) => {
        const filepath = this.#path(user_id, directory, filename);
        
        return this.firestore.delete_by_id(
            this.#id(filepath)
        );
    }

    #delete_cloudinary_asset = (user_id: string, directory: string | null, filename: string | null) => {
        return cloudinary.uploader.destroy(
            this.#path(user_id, directory, filename),
            { invalidate: true }
        );
    }

    #get_asset_record = (user_id: string, directory: string | null, filename: string | null) : Promise<Media | null> => {
        const filepath = this.#path(user_id, directory, filename);

        return this.firestore.get_by_id(
            this.#id(filepath)
        );
    }

    #list_assets = (user_id: string, directory: string | null) : Promise<Media[] | null> => {
        return this.firestore.select_by([
            { field: CONSTANTS.FIELDS.MEDIA.USER_ID, operator: '==', value: user_id },
            { field: CONSTANTS.FIELDS.MEDIA.DIRECTORY, operator: '==', value: directory }
        ]);
    }

    #path = (user_id: string, directory: string | null = null, filename: string | null = null) => {
        const path_elements = [this.root, user_id];

        directory && path_elements.push(directory);
        filename && path_elements.push(filename);

        return path_elements.join('/');
    }
    
    #random_filename = (directory: string | null = null) => {
        return this.snippr_id.generate_filename(
            directory ? directory?.replace(/\//g, '_') : null
        );
    }

    #sign_request = async (signing_params = {}) => {
        const api_key = process.env.CLOUDINARY_API_KEY;
        const timestamp = Math.round((new Date).getTime() / 1000);
        const params = {
            ...signing_params,
            invalidate: true,
            timestamp: timestamp,
        };
        
        const signature = await cloudinary.utils.api_sign_request(
            params,
            process.env.CLOUDINARY_SECRET!
        );

        return { api_key, signature, timestamp };
    }

    #transformations = (dimensions: any, pixel_ratio: any) => {
        return {
            crop: 'fit',
            dpr: pixel_ratio ?? 1,
            fetch_format: 'png',
            height: dimensions?.height ?? 'ih',
            width: dimensions?.width ?? 'iw',
        };
    }

    #upload_url = (asset_type: string = 'image') => {
        return `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${asset_type}/upload`;
    }

    #url = (path: string, dimensions: any, pixel_ratio: any, version: string | number | null = null) => {
        const transformations = this.#transformations(dimensions, pixel_ratio);

        return cloudinary.url(
            path,
            version ? {...transformations, version: version} : transformations
        );
    }
    
    delete_asset = (user_id: string, directory: string | null, filename: string | null) => {
        return Promise.all([
            this.#delete_asset_record(user_id, directory, filename),
            this.#delete_cloudinary_asset(user_id, directory, filename)
        ]);
    }

    delete_asset_by_url = (requesting_user_id: string, url: string) => {
        const { user_id, directory, filename } = this.#deconstruct_path(url);

        if (user_id !== requesting_user_id) throw new Error('Error: Files may only be deleted by their owners');

        return Promise.all([
            this.#delete_asset_record(user_id, directory, filename),
            this.#delete_cloudinary_asset(user_id, directory, filename)
        ]);
    }

    get_asset_url = async (user_id: string, directory: string | null, filename: string | null, dimensions: any, pixel_ratio: any = null) => {
        if (filename) {
            const asset_record = await this.#get_asset_record(
                user_id,
                directory,
                filename
            );

            return asset_record ? this.#url(
                asset_record[CONSTANTS.FIELDS.MEDIA.PATH],
                dimensions,
                pixel_ratio,
                asset_record[CONSTANTS.FIELDS.MEDIA.VERSION]
            ) : null;
        } else {
            const directory_assets = await this.#list_assets(user_id, directory);

            return directory_assets?.length ? Promise.all(directory_assets.map(
                (asset_record) => this.#url(
                    asset_record[CONSTANTS.FIELDS.MEDIA.PATH],
                    dimensions,
                    pixel_ratio,
                    asset_record[CONSTANTS.FIELDS.MEDIA.VERSION]
                )
            )) : null;
        }
    }

    get_upload_config = async (user_id: string, directory: string | null, filename: string | null) => {
        const file = filename ?? this.#random_filename(directory);
        const dest = this.#path(user_id, directory, file);
        const signature = await this.#sign_request({ public_id: dest });

        return {
            dest: dest,
            endpoint: this.#upload_url(),
            filename: file,
            ...signature,
        };
    }

    handle_asset_uploaded = async (dest: string, version: string | number) => {
        const { user_id, directory, filename } = await this.#deconstruct_path(dest);
        
        return this.#create_asset_record(
            user_id,
            directory,
            filename,
            version
        );
    }
}