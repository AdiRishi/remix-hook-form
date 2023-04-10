import {
  FieldValues,
  Resolver,
  FieldErrors,
  FieldErrorsImpl,
  DeepRequired,
} from "react-hook-form";
/**
 * Parses the data from an HTTP request and validates it against a schema.
 *
 * @async
 * @template T
 * @param {Request} request - An object that represents an HTTP request.
 * @param validator - A function that resolves the schema.
 * @returns {Promise<{ errors: any[] | undefined; data: T | undefined }>} - A Promise that resolves to an object containing the validated data or any errors that occurred during validation.
 */
export const getValidatedFormData = async <T extends FieldValues>(
  request: Request,
  resolver: Resolver
) => {
  const data = await parseFormData<T>(request);
  const validatedOutput = await validateFormData<T>(data, resolver);
  return validatedOutput;
};

/**
 * Helper method used in actions to validate the form data parsed from the frontend using zod and return a json error if validation fails.
 * @param data Data to validate
 * @param resolver Schema to validate and cast the data with
 * @returns Returns the validated data if successful, otherwise returns the error object
 */
export const validateFormData = async <T extends FieldValues>(
  data: any,
  resolver: Resolver
) => {
  const { errors, values } = await resolver(
    data,
    {},
    { shouldUseNativeValidation: false, fields: {} }
  );

  if (Object.keys(errors).length > 0) {
    return { errors: errors as FieldErrors<T>, data: undefined };
  }

  return { errors: undefined, data: values as T };
};
/**
  Creates a new instance of FormData with the specified data and key.
  @template T - The type of the data parameter. It can be any type of FieldValues.
  @param {T} data - The data to be added to the FormData. It can be either an object of type FieldValues.
  @param {string} [key="formData"] - The key to be used for adding the data to the FormData.
  @returns {FormData} - The FormData object with the data added to it.
*/
export const createFormData = <T extends FieldValues>(
  data: T,
  key: string = "formData"
): FormData => {
  const formData = new FormData();
  const finalData = JSON.stringify(data);
  formData.append(key, finalData);
  return formData;
};
/**

Parses the specified Request object's FormData to retrieve the data associated with the specified key.
@template T - The type of the data to be returned.
@param {Request} request - The Request object whose FormData is to be parsed.
@param {string} [key="formData"] - The key of the data to be retrieved from the FormData.
@returns {Promise<T>} - A promise that resolves to the data of type T.
@throws {Error} - If no data is found for the specified key, or if the retrieved data is not a string.
*/
export const parseFormData = async <T extends any>(
  request: Request,
  key: string = "formData"
): Promise<T> => {
  const formData = await request.formData();
  const data = formData.get(key);
  if (!data) {
    throw new Error("No data found");
  }
  if (!(typeof data === "string")) {
    throw new Error("Data is not a string");
  }
  return JSON.parse(data);
};
/**

Merges two error objects generated by a resolver, where T is the generic type of the object.
The function recursively merges the objects and returns the resulting object.
@template T - The generic type of the object.
@param {Partial<FieldErrorsImpl<DeepRequired<T>>>} frontendErrors - The frontend errors
@param {Partial<FieldErrorsImpl<DeepRequired<T>>>} backendErrors - The backend errors
@returns {Partial<FieldErrorsImpl<DeepRequired<T>>>} - The merged errors of type Partial<FieldErrorsImpl<DeepRequired<T>>>.
*/
export const mergeErrors = <T extends FieldValues>(
  frontendErrors: Partial<FieldErrorsImpl<DeepRequired<T>>>,
  backendErrors: Partial<FieldErrorsImpl<DeepRequired<T>>>
) => {
  if (!backendErrors) {
    return frontendErrors;
  }

  for (const [key, rightValue] of Object.entries(backendErrors) as [
    keyof T,
    DeepRequired<T>[keyof T]
  ][]) {
    if (typeof rightValue === "object" && !Array.isArray(rightValue)) {
      if (!frontendErrors[key]) {
        frontendErrors[key] = {} as DeepRequired<T>[keyof T];
      }
      mergeErrors(frontendErrors[key]!, rightValue);
    } else {
      if (frontendErrors[key]) {
        if (rightValue.message) {
          frontendErrors[key]!.message = rightValue.message;
        }
      } else {
        frontendErrors[key] = rightValue;
      }
    }
  }

  return frontendErrors;
};
