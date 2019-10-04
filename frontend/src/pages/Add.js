import React, { useState, useEffect, useMemo } from 'react'
import { EventEmitter } from 'events'
import { Readable } from 'stream'
import cn from 'classnames'

import { generate } from '../../../lib/id'
import { useUpdate } from '../hooks'

import Wrapper from '../components/Wrapper.js'
import { RecordCard, Card, Meta } from '../components/List.js'

import styles from './add.css'

// GLOBALS (have to move)

const entitySchema = {
  $id: 'arso.xyz/Entity',
  label: 'Entity',
  properties: {
    label: {
      type: 'string',
      description: 'Label'
    },
    description: {
      type: 'string',
      description: 'Description'
    },
    resources: {
      type: 'array',
      description: 'Resource',
      items: {
        type: 'string'
      }
    }
  }
}

const videoSchema = {
  $id: 'arso.xyz/Video',
  label: 'Video',
  refines: 'arso.xyz/Entity',
  properties: {
    primaryResource: { type: 'relation', description: 'Primary video resource' },
    derivedResources: { type: 'array', items: { type: 'relation' } }
  }
}

let store
function getStore () {
  if (!store) store = new ResourceStore()
  return store
}

export default function AddPage (props) {
  return (
    <Wrapper>
      <h1>Add files</h1>
      <UploadFile />
    </Wrapper>
  )
}

function UploadFile (props) {
  // const [fileList, setFileList] = useState([])
  const [selectedFile, selectFile] = useState(null)
  const fileList = getStore().draftFiles || []
  const inputValue = fileList.map(f => f.domFile)
  const triggerUpdate = useUpdate()

  console.log('render', fileList)
  return (
    <div className={styles.Page}>
      <nav>
        <form>
          <input files={inputValue} type='file' onChange={onFileInputChange} multiple />
        </form>
        <ul className={styles.FileList}>
          {fileList.map((file, i) => (
            <li key={i} className={cn({ [styles.active]: file === selectedFile })}>
              <a onClick={e => selectFile(file)}>{file.name}</a>
            </li>
          ))}
        </ul>
        {fileList.length && <button onClick={e => onUploadStart()}>Upload</button>}
      </nav>
      <div>
        {selectedFile && <ResourceFromFile file={selectedFile} />}
      </div>
    </div>
  )

  function onUploadStart () {
    const chunkSize = 1024 * 1024
    let offset = 0
    for (const file of fileList) {
      const domFile = file.domFile
      const fileReader = new FileReader(domFile)
      const stream = new Readable({
        read () {
          if (offset > file.size) {
            this.push(null)
          }
          const end = offset + chunkSize
          const slice = domFile.slice(offset, offset + chunkSize)
          fileReader.readAsArrayBuffer(slice)
          offset = end
        }
      })
      fileReader.onloadend = function loaded (event) {
        var data = event.target.result
        if (data instanceof ArrayBuffer) data = Buffer.from(new Uint8Array(event.target.result))
        stream.push(data)
      }
      stream.on('data', d => console.log('DATA', file.name, d))
      stream.on('end', () => console.log('END', file.name))
    }
  }

  function onFileInputChange (e) {
    const fileList = e.target.files
    console.log('onchange', fileList)
    const files = []
    for (const file of fileList) {
      // TODO: Preserve ids between changes.
      files.push({
        id: generate(),
        name: file.webkitRelativePath || file.name,
        size: file.size,
        domFile: file,
        pending: false,
        done: false,
        written: 0,
        speed: 0
      })
    }
    getStore().setDraftFiles(files)
    triggerUpdate()
    console.log('files', files)
    // setFileList(files)
  }
}

function ResourceFromFile (props) {
  const { file } = props
  const store = getStore()
  const resource = store.fromFile(file)
  return (
    <Resource resource={resource} />
  )
}

function Resource (props) {
  const [label, setLabel] = useState('')
  const { resource } = props

  return (
    <div className={styles.Resource}>
      <h3>Resource</h3>
      <ul>
        <li>
          <em>ID:</em>
          <strong>{resource.id}</strong>
        </li>
        <li>
          <em>Files:</em>
          <ul>
            {resource.files.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        </li>
        <li>
          <em>Label</em>
          <span>
            {label}
            <input type='text' onChange={e => setLabel(e.target.value)} />
          </span>
        </li>
        <li>
          <em>Extract Metadata</em>
          <span>
            <button onClick={e => {}}>Auto-detect extractor and run</button>
          </span>
        </li>
      </ul>
      <Records resource={resource} />
    </div>
  )
}

function Records (props) {
  const { resource } = props
  const triggerUpdate = useUpdate()
  const store = getStore()
  useEffect(() => {
    store.on('update', () => {
      console.log('update!', store)
      triggerUpdate()
    })
    return () => store.removeListener('update', triggerUpdate)
  }, [])
  const records = store.getRecordsForResource(resource)

  const createEntity = (
    <div>
      <a onClick={e => store.createEntityForResource(resource)}>
        Create new entity
      </a>
      <span> or </span>
      <a>add to existing entity</a>
    </div>
  )

  if (!records.length) return createEntity

  const schemas = store.getSchemas()

  return (
    <div>
      <RecordList records={records} onChange={onRecordChange} />
      <div>
        Add schema:
        <div>
          {schemas.map((schema, i) => (
            <a key={i} onClick={e => store.createRecordForResource(schema.$id, resource)}>{schema.label}</a>)
          )}
        </div>
      </div>
    </div>
  )

  function onRecordChange (record) {
    console.log('onRecordChange', record)
    store.put(record)
  }
}

function RecordList (props) {
  const { records, onChange } = props
  console.log(records)
  return (
    <div>
      {records.map((record, i) => {
        const Component = componentForRecord(record)
        return <Component record={record} onChange={onChange} key={i} />
      })}
    </div>
  )
}

function componentForRecord (record) {
  const components = {
    'arso.xyz/Entity': Entity,
    default: RecordForm
  }
  if (components[record.schema]) return components[record.schema]
  else return components.default
}

function RecordForm (props) {
  const { record, onChange } = props
  const { schema, source, id, value } = record
  const store = getStore()

  const fields = jsonSchemaToFields(store.getSchema(schema), {
    // include: ['label', 'description']
  })
  const body = (
    <Form fields={fields} value={value} onChange={onFormChange} />
  )

  function onFormChange (newValue) {
    const newRecord = { ...record, value: newValue }
    console.log('setValue', newRecord)
    onChange(newRecord)
  }

  return (
    <Card
      meta={<Meta record={record} />}
      body={body}
    />
  )
}

function Entity (props) {
  const { record, onChange } = props
  console.log('Entity', record)
  const { source, schema, id, value } = record

  const fields = jsonSchemaToFields(entitySchema, {
    include: ['label', 'description']
  })
  const body = (
    <Form fields={fields} value={value} onChange={onFormChange} />
  )

  function onFormChange (newValue) {
    const newRecord = { ...record, value: newValue }
    console.log('setValue', newRecord)
    onChange(newRecord)
  }

  return (
    <Card
      meta={<Meta record={record} />}
      body={body}
    />
  )
}

function jsonSchemaToFields (schema, opts) {
  if (Array.isArray(opts.include)) opts.include = arrayFilter(opts.include)
  const fields = []
  for (const [key, value] of Object.entries(schema.properties)) {
    if (opts.include && !opts.include(key)) continue
    fields.push({
      name: key,
      label: value['ui:label'] || value.description || key,
      ...value
    })
  }

  return fields

  function arrayFilter (include) {
    return (key) => include.indexOf(key) > -1
  }
}

function Form (props) {
  const { fields, value, onChange } = props
  console.log('Form', fields, value)
  return (
    <form>
      {fields.map(field => makeField(field))}
    </form>
  )

  function makeField (field) {
    let { name, label, type, Component } = field
    if (!Component) Component = getFieldWidget(type)
    return (
      <div key={name}>
        <label htmlFor={name}>
          {label}
        </label>
        <Component value={value[name] || null} onChange={value => onValueChange(name, value)} />
      </div>
    )
  }

  function onValueChange (name, fieldValue) {
    onChange({ ...value, [name]: fieldValue })
  }
}

function getFieldWidget (type) {
  if (type === 'string') {
    return StringWidget
  } else return UnsuportedWidget
}

function StringWidget (props) {
  const value = props.value || ''
  return <input type='text' onChange={e => props.onChange(e.target.value)} value={value} />
}

function UnsuportedWidget (props) {
  const value = props.value || ''

  return (
    <span>
      <em>Not supported</em>
      <span>{forceToString(value)}</span>
    </span>
  )

  function forceToString (value) {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    } else return JSON.stringify(value)
  }
}

class ResourceStore extends EventEmitter {
  constructor () {
    super()
    this.byFilename = {}
    this.byId = {}
    this.resources = []
    this.records = {}
    this.recordsByResource = {}
  }

  getRecordsForResource (resource) {
    if (this.recordsByResource[resource.id]) {
      return [...this.recordsByResource[resource.id]].map(link => this.records[link])
    } else return []
  }

  getEntityIdForResource (resource) {
    let c = this.getRecordsForResource(resource)
    if (c.length) return c[0].id
    else return generate()
  }

  createEntityForResource (resource) {
    const record = {
      id: generate(),
      schema: 'arso.xyz/Entity',
      value: {
        resources: [resource.id],
        label: '',
        description: '',
        primarySchema: null
      }
    }

    this.put(record)
  }

  createRecordForResource (schemaName, resource) {
    const record = {
      id: this.getEntityIdForResource(resource),
      schema: schemaName,
      value: {}
    }

    const schema = this.getSchema(schemaName)

    // TOOD: Derive this from property definitions in the schema.
    if (schema.properties.resources) {
      record.value.resources = [resource.id]
    }
    if (schema.properties.primaryResource) {
      record.value.primaryResource = resource.id
    }

    this.put(record)
  }

  put (record) {
    const self = this
    console.log('put', record)
    const link = record.link || makeLink(record)
    this.records[link] = record
    const { value } = record

    // TOOD: Derive this from property definitions in the schema.
    if (value.resources) value.resources.forEach(addToResourceIndex)
    if (value.primaryResource) addToResourceIndex(value.primaryResource)
    console.log(this.records)

    this.emit('update')

    function addToResourceIndex (id) {
      if (!self.recordsByResource[id]) {
        self.recordsByResource[id] = new Set()
      }
      self.recordsByResource[id].add(link)
    }
  }

  fromFile (file) {
    if (!this.byFilename[file.name]) {
      const resource = this._createFromFile(file)
      this.byFilename[file.name] = resource
      this.byId[resource.id] = resource
      this.resources.push(resource)
    }
    return this.byFilename[file.name]
  }

  getSchemas () {
    return [entitySchema, videoSchema]
  }

  getSchema (id) {
    const s = this.getSchemas().filter(s => s.$id === id)
    if (s.length) return s[0]
    return null
  }

  _createFromFile (file) {
    return {
      files: [file],
      id: generate(),
      mimetype: 'video/mp4' // todo: derive from filename
    }
  }

  setDraftFiles (draftFiles) {
    this.draftFiles = draftFiles
  }
}

function makeLink (record) {
  let { id, source, schema } = record
  source = source || '~'
  return [source, schema, id].join('$')
}
